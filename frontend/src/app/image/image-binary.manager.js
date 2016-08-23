(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageBinaryManager', wvImageBinaryManager)
        .constant('WvImageQualities', {
            // 0 is reserved as none..
            PIXELDATA: 101,
            LOSSLESS: 100,
            LOW: 1, // resampling to 150 px + compressed to jpeg100
            MEDIUM: 2 // resampling to 1000 px + compressed to jpeg100
        });

    /* @ngInject */
    function wvImageBinaryManager($q, wvConfig, WvImageQualities, wvCornerstoneImageAdapter) {

        /** wvImageBinaryManager
         *
         * Manage the binary loading side of images.
         *
         * As it is quite complex and requires specific caching & prefetching algorithm,
         * it is out of the standard image manager.
         *
         */
        var service = {
            get: get,
            free: free,
            listCachedBinaries: listCachedBinaries,
            getBestQualityInCache: getBestQualityInCache,
            onBinaryLoaded: new osimis.Listener(), // (id, quality, cornerstoneImageObject)
            onBinaryUnLoaded: new osimis.Listener(), // (id, quality)
            requestLoading: requestLoading,
            abortLoading: abortLoading
        };

        ////////////////

        /** _cache: Promise<cornerstoneImageObject>[<imageId>][<quality>]
         *
         * A cache of request (and their results) to avoid multiple request.
         *
         * @invariant _cache[imageId][quality] = Promise<cornerstoneImageObject>
         * @invariant _cache[*] should always contains at least one item for hasCache method to work
         *
         */
        var _cache = {};

        /** _loadedCachedRequests: boolean[imageId][quality]
         *
         * Used to differentiate unfineshed cached request from fineshed cached requests.
         *
         */
        var _loadedCacheIndex = {};

        /** _cacheReferenceCount: int[<imageId>][<quality>]
         *
         * Represent the number of time the cache has been get
         *
         */
        var _cacheReferenceCount = {};

        var pool = new window.osimis.WorkerPool({
            path: /* @inline-worker: */ '/app/image/image-parser.worker/main.js',
            workerCount: 6, // @todo throw exception if workerCount < 2
            createPromiseFn: $q,
            taskPriorityPolicy: new osimis.TaskPriorityPolicy(_cache)
        });

        // Send the orthanc API URL to each threads
        pool.broadcastMessage({
            type: 'setOrthancUrl',
            orthancApiUrl: wvConfig.orthancApiURL
        });

        // @todo Free inline-worker's ObjectUrl
        
        function requestLoading(id, quality, priority) {
            // Generate cache index
            // used to differentiate cached requests from finished cached requests
            if (!_loadedCacheIndex[id]) {
                _loadedCacheIndex[id] = {};
            }

            // Generate request cache (if inexistant)
            if (!_cache[id]) {
                _cache[id] = {};
            }
            if (!_cache[id][quality]) {
                // download klv, extract metadata & decompress data to raw image
                var requestPromise = pool
                    .queueTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality
                    })
                    .then(function(result) {
                        // Loading done

                        // Abort the finished loading when an abortion has been asked but not made in time
                        if (!_cacheReferenceCount[id][quality]) {
                            // Remove promise from cache
                            delete _cacheReferenceCount[id][quality];
                            delete _cache[id][quality]; // @todo inefficient, use null & adapt getBestQualityInCache instead
                            if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                                delete _loadedCacheIndex[id][quality];
                            }
                            return $q.reject('aborted');
                        }

                        // configure cornerstone related object methods
                        var cornerstoneImageObject = wvCornerstoneImageAdapter.process(id, quality, result.cornerstoneMetaData, result.pixelBuffer, result.pixelBufferFormat);

                        // consider the promise to be resolved
                        _loadedCacheIndex[id][quality] = true;
                        _cache[id][quality].isLoaded = true;

                        // Set the cache size so total memory size can be limited
                        _cache[id][quality].size = result.pixelBuffer.byteLength;

                        // trigger binaryLoaded event
                        service.onBinaryLoaded.trigger(id, quality, cornerstoneImageObject);

                        return cornerstoneImageObject;
                    })
                    .then(null, function(err) {
                        // Loading aborted

                        // This is called even when the error comes from the adapter (promise <.then(null, function(err) {...})> syntax)
                        // to be sure the promise is uncached anytime the promise is rejected

                        // Remove promise from cache
                        delete _cacheReferenceCount[id][quality];
                        delete _cache[id][quality]; // @todo inefficient, use null & adapt getBestQualityInCache instead
                        if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                            delete _loadedCacheIndex[id][quality];
                        }
                            
                        // Trigger binary has been unloaded (used by torrent-like loading bar)
                        // service.onBinaryUnLoaded.trigger(id, quality);

                        // Propagate promise error
                        return $q.reject(err);
                    });

                _cache[id][quality] = new osimis.ImageBinaryRequest(id, quality, requestPromise);
            }

            // Increment cache reference count
            _cache[id][quality].pushPriority(priority);
            if (!_cacheReferenceCount[id]) {
                _cacheReferenceCount[id] = {};
            }
            if (!_cacheReferenceCount[id][quality]) {
                _cacheReferenceCount[id][quality] = 0;
            }
            ++_cacheReferenceCount[id][quality];

            // Return Promise<cornerstoneImageObject>
            return _cache[id][quality].promise;
        }

        // Clean cache every 5 seconds if cache size > 2000
        window.setInterval(function() {
            // @todo check once binary has been loaded + add debounce
            
            var id, quality, totalCacheSizeByQuality = {}, totalFlushedCacheSizeByQuality = {};

            // Calculate cache amount by looping through each requests
            for (id in _cache) {
                for (quality in _cache[id]) {
                    var cachedRequest = _cache[id][+quality];

                    // Init totalCacheSizeByQuality[quality] if required
                    totalCacheSizeByQuality[+quality] = totalCacheSizeByQuality[+quality] || 0;
                    
                    // Increment totalCache amount
                    if (cachedRequest.isLoaded) {
                        totalCacheSizeByQuality[+quality] += cachedRequest.size;
                    }
                }
            }

            // Flush lossless files
            _flushCache(WvImageQualities.LOSSLESS, 1024 * 1024 * 700); // Max 700mo
            _flushCache(WvImageQualities.MEDIUM, 1024 * 1024 * 700); // Max 700mo
            _flushCache(WvImageQualities.LOW, 1024 * 1024 * 300); // Max 300mo

            function _flushCache(quality, cacheSizeLimit) {
                totalFlushedCacheSizeByQuality[quality] = totalFlushedCacheSizeByQuality[quality] || 0;
                totalCacheSizeByQuality[quality] = totalCacheSizeByQuality[quality] || 0;

                if (totalCacheSizeByQuality[quality] < cacheSizeLimit) { 
                    return;
                }
                for (var id in _cacheReferenceCount) {
                    // Stop flush too much as soon as there is enough space left
                    if (totalCacheSizeByQuality[quality] < cacheSizeLimit) {
                        return;
                    }

                    // Flush cache
                    var refCount = _cacheReferenceCount[id][quality];
                    if (refCount === 0) {
                        // Decrement cache size
                        var flushedSize = _cache[id][quality].size || 0;
                        totalCacheSizeByQuality[quality] -= flushedSize;

                        // Save flushed quantity for logging purpose
                        totalFlushedCacheSizeByQuality[quality] += flushedSize;

                        // Clean request cache
                        _cache[id][quality] = null;
                        delete _cache[id][quality]; // @todo inefficient, use null & adapt getBestQualityInCache instead

                        // Clean cache index
                        if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                            delete _loadedCacheIndex[id][quality];
                        }
                        delete _cacheReferenceCount[id][quality];
                    }
                }

                console.log('flush cache q:', quality, 'pre:', totalCacheSizeByQuality[quality] / 1024 / 1024, 'post:', totalFlushedCacheSizeByQuality[quality] / 1024 / 1024);
            }
        }, 5000);

        function abortLoading(id, quality, priority) {
            // Check the item is cached
            if (!_cacheReferenceCount.hasOwnProperty(id) || !_cacheReferenceCount[id].hasOwnProperty(quality) || _cacheReferenceCount[id][quality] < 1) {
                throw new Error('Free uncached image binary.');
            }

            // Decount reference
            --_cacheReferenceCount[id][quality];
            if (_cache[id][quality]) {
                _cache[id][quality].popPriority(priority);
            }

            // Cancel request if pending
            if (_cacheReferenceCount[id][quality] === 0 && !_loadedCacheIndex[id][quality]) {
                // Cancel request if pending
                pool
                    .abortTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality
                    });

                // Clean request cache
                _cache[id][quality] = null;
                delete _cache[id][quality]; // @todo inefficient, use null & adapt getBestQualityInCache instead

                // Clean cache index
                if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                    delete _loadedCacheIndex[id][quality];
                }
                delete _cacheReferenceCount[id][quality];
                
                // Trigger binary has been unloaded (used by torrent-like loading bar)
                service.onBinaryUnLoaded.trigger(id, quality);
            }
        }

        /** wvImageBinaryManager#get(id, quality)
         *
         * @param id <instanceId>:<frameIndex>
         * @param quality see WvImageQualities
         * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
         *
         */
        function get(id, quality) {
            return requestLoading(id, quality, 0);
        }

        /** wvImageBinaryManager#free(id, quality)
         *
         * Free the defined image binary.
         * Reference counting implementation (if the image was called 4 times, #free has to be called 4 time as well to effectively free the memory).
         *
         * @pre The promise returned by wvImageBinary#get has been resolved (do not call free when the promise has been rejected !).
         * @pre The user has deleted his own pointers to the binary in order to allow the GC to clean the memory.
         *
         * @param id <instanceId>:<frameIndex>
         * @param quality see WvImageQualities
         *
         */
        function free(id, quality) {
            return abortLoading(id, quality, 0)
        }

        /** wvImageBinaryManager#listCachedBinaries(id)
         *
         * Return all the cached binaries of an image, listed
         * by their quality number.
         *
         * @param id <instanceId>:<frameIndex>
         * @return [] or [<quality-value: int>, ...]
         *
         */
        function listCachedBinaries(id) {
            var result = [];

            if (!_loadedCacheIndex[id]) {
                result = [];
            }
            else {
                result = _
                    .keys(_loadedCacheIndex[id])
                    .map(function(k) {
                        return +k; // Make sure keys stay integers
                    });
            }

            return result;
        }

        /** wvImageBinaryManager#getCachedHighestQuality(id)
         *
         * @param id <instanceId>:<frameIndex>
         * @return quality: int
         *
         */
        function getBestQualityInCache(id) {
            if (!_loadedCacheIndex[id]) {
                return null;
            }

            var highestQuality = _.max(_.keys(_loadedCacheIndex[id]));

            return highestQuality;
        }

        ////////////////

        return service;
    }
})();