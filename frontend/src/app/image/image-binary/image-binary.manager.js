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

        var _cache = new osimis.ImageBinariesCache();

        /** _loadedCachedRequests: boolean[imageId][quality]
         *
         * Used to differentiate unfineshed cached request from fineshed cached requests.
         *
         */
        var _loadedCacheIndex = {};

        var pool = new window.osimis.WorkerPool({
            path: /* @inline-worker: */ '/app/image/image-parser.worker/main.js',
            workerCount: 6,
            createPromiseFn: $q,
            taskPriorityPolicy: new osimis.TaskPriorityPolicy(_cache) // @todo break dependency
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
            var request = _cache.get(id, quality);
            if (!request) {
                // Set http headers
                // @note Since the request is queued, headers configuration might changes in the meanwhile (before the request execution).
                //       However, since they are linked by reference (and not copied), changes will be bound.
                var headers = wvConfig.httpRequestHeaders; // used to set user auth tokens for instance

                // Download klv, extract metadata & decompress data to raw image
                var requestPromise = pool
                    .queueTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality,
                        headers: headers
                    })
                    .then(function(result) {
                        // Loading done

                        // Abort the finished loading when an abortion has been asked but not made in time
                        if (!_cache.getRefCount(id, quality)) {
                            // Remove promise from cache
                            _cache.remove(id, quality);
                            if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                                delete _loadedCacheIndex[id][quality];
                            }
                            return $q.reject('aborted');
                        }

                        // configure cornerstone related object methods
                        var cornerstoneImageObject = wvCornerstoneImageAdapter.process(id, quality, result.cornerstoneMetaData, result.pixelBuffer, result.pixelBufferFormat);

                        // consider the promise to be resolved
                        _loadedCacheIndex[id][quality] = true;
                        var request = _cache.get(id, quality);
                        request.isLoaded = true;

                        // Set the cache size so total memory size can be limited
                        _cache.setBinarySize(id, quality, result.pixelBuffer.byteLength);
                        // request.size = result.pixelBuffer.byteLength

                        // trigger binaryLoaded event
                        service.onBinaryLoaded.trigger(id, quality, cornerstoneImageObject);

                        return cornerstoneImageObject;
                    })
                    .then(null, function(err) {
                        // Loading aborted

                        // This is called even when the error comes from the adapter (promise <.then(null, function(err) {...})> syntax)
                        // to be sure the promise is uncached anytime the promise is rejected

                        // Remove promise from cache
                        _cache.remove(id, quality);
                        if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                            delete _loadedCacheIndex[id][quality];
                        }
                            
                        // Trigger binary has been unloaded (used by torrent-like loading bar)
                        // service.onBinaryUnLoaded.trigger(id, quality);

                        // Propagate promise error
                        return $q.reject(err);
                    });
                
                request = new osimis.ImageBinaryRequest(id, quality, requestPromise);
                _cache.add(id, quality, request);
            }

            // Increment cache reference count
            _cache.push(id, quality);
            request.pushPriority(priority);

            // Return Promise<cornerstoneImageObject>
            return request.promise;
        }

        // Flush cache every 5 seconds
        // @todo move inside cache module
        window.setInterval(function() {
            // @todo check once binary has been loaded + add debounce
            _cache.flush();
        }, 5000);

        function abortLoading(id, quality, priority) {
            // Check the item is cached
            if (_cache.getRefCount(id, quality) < 1) {
                throw new Error('Free uncached image binary.');
            }

            // Decount reference
            _cache.pop(id, quality)
            var request = _cache.get(id, quality);
            request.popPriority(priority);

            // Cancel request if pending
            if (_cache.getRefCount(id, quality) === 0 && !_loadedCacheIndex[id][quality]) {
                // Cancel request if pending
                pool
                    .abortTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality
                    });

                // Request will be cleaned in the promise rejection
                // _cache.remove(id, quality);

                // Clean cache index
                // if (typeof _loadedCacheIndex[id][quality] !== 'undefined') {
                //     delete _loadedCacheIndex[id][quality];
                // }
                
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