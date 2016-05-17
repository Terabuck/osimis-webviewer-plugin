(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageBinaryManager', wvImageBinaryManager)
        .constant('WvImageQualities', {
            // 0 is reserved as none..
        	LOSSLESS: 100,
			R150J100: 1, // resampling to 150 px + compressed to jpeg100
			R1000J100: 2 // resampling to 1000 px + compressed to jpeg100
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
            getBestQualityInCache: getBestQualityInCache,
            onBinaryLoaded: new osimis.Listener() // (id, quality, cornerstoneImageObject)
        };

        ////////////////

        var pool = new window.osimis.WorkerPool({
            path: '/src/app/image/image-parser.async/main.js',
            workerCount: 4,
            createPromiseFn: $q
        });

        /** _cache: cornerstoneImageObject[<imageId>][<quality>]
         *
         * @invariant _cache[imageId][quality] = cornerstoneImageObject
         * @invariant _cache[*] should always contains at least one item for hasCache method to work
         *
         */
        var _cache = {};

        /** _cacheReferenceCount: int[<imageId>][<quality>]
         *
         * Represent the number of time the cache has been get
         *
         */
        var _cacheReferenceCount = {};

        /** wvImageBinaryManager#get(id, quality)
         *
         * @param id <instanceId>:<frameIndex>
         * @param quality see WvImageQualities
         * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
         *
         */
        function get(id, quality) {
            // Generate cache (if inexistant)
        	if (!_cache[id]) {
        		_cache[id] = {};
        	}
        	if (!_cache[id][quality]) {
                // pool
                //     .filterTasks({
                //         quality: 2
                //     })
                //     .setPriority(1);

	            // download klv, extract metadata & decompress data to raw image
	            _cache[id][quality] = pool
                    .queueTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality
                    })
	                .then(function(result) {
                        // Loading done

                        // Abort the finished loading when an abortion has been asked but not made in time
                        if (_cacheReferenceCount[id][quality] === 0) {
                            return $q.reject('aborted');
                        }

	                    // configure cornerstone related object methods
	                    var cornerstoneImageObject = wvCornerstoneImageAdapter.process(id, quality, result.cornerstoneMetaData, result.pixelBuffer, result.pixelBufferFormat);

	                    // trigger binaryLoaded event
	                    service.onBinaryLoaded.trigger(id, quality, cornerstoneImageObject);

	                    return cornerstoneImageObject;
	                })
                    .then(null, function(err) {
                        // Loading aborted

                        // This is called even when the error comes from the adapter (promise <.then(null, function(err) {...})> syntax)
                        // to be sure the promise is uncached anytime the promise is rejected

                        // Remove promise from cache / Uncount reference
                        _cacheReferenceCount[id][quality] = 1; // Reset the reference count to 1 so failed loading do not have to be freed
                        service.free(id, quality);

                        // Propagate promise error
                        // throw err;
                    });
            }

            // Increment cache reference count
            if (!_cacheReferenceCount[id]) {
                _cacheReferenceCount[id] = {};
            }
            if (!_cacheReferenceCount[id][quality]) {
                _cacheReferenceCount[id][quality] = 0;
            }
            ++_cacheReferenceCount[id][quality];

            // Return Promise<cornerstoneImageObject>
            return _cache[id][quality];
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
            // Check the item is cached
            if (!_cacheReferenceCount.hasOwnProperty(id) || !_cacheReferenceCount[id].hasOwnProperty(quality) || _cacheReferenceCount[id][quality] < 1) {
                throw new Error('Free uncached image binary.');
            }

            // Decount reference
            --_cacheReferenceCount[id][quality];

            // Clean cache when no reference left - Cancel request if pending
            if (_cacheReferenceCount[id][quality] === 0) {
                // Cancel request if pending
                pool
                    .abortTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality
                    });

                // Clean cache
                _cache[id][quality] = null;
                delete _cache[id][quality]; // @todo inefficient, use null & adapt getBestQualityInCache instead
            }
        }

        /** wvImageBinaryManager#getCachedHighestQuality(id)
         *
         * @param id <instanceId>:<frameIndex>
         * @return Promise<cornerstoneImageObject>
         *         returns a promise to avoid having duplicate pendant requests
         *         (the request is cached instead of the result)
         *
         */
        function getBestQualityInCache(id) {
        	if (!_cache[id]) {
        		return null;
        	}

        	var highestQuality = _.max(_.keys(_cache[id]));

            return highestQuality;
        }

        ////////////////

        return service;
    }
})();