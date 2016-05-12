(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageBinaryManager', wvImageBinaryManager)
        .constant('WvImageQualities', {
            // 0 is reserved as none..
        	J100: 100,
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
            abortLoading: abortLoading,
            free: free,
            getBestQualityInCache: getBestQualityInCache,
            onBinaryLoaded: new osimis.Listener() // (id, quality, cornerstoneImageObject)
        };

        ////////////////

        window.osimis.WorkerPool.createPromise = $q; // @todo move into class file
        var imageParserPool = new window.osimis.WorkerPool('/src/app/image/image-parser.async/main.js', 1);

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

        /** _binaryIsLoading: bool[<imageId>][<quality>]
         *
         * Flag at true when the xhr request is pending
         * Used to abort request
         *
         */
        var _binaryIsLoading = {};

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
	            var splitted = id.split(':');
	            var instanceId = splitted[0];
	            var frameIndex = splitted[1] || 0;

	            var url = null;
	            switch (quality) {
	            case WvImageQualities.J100:
	            	url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/8bit' + '/jpeg:100' + '/klv';
	            	break;
	            case WvImageQualities.R1000J100:
	                url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:1000' + '/8bit' + '/jpeg:100' + '/klv';
	                break;
                case WvImageQualities.R150J100:
	                url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:150' + '/8bit' + '/jpeg:100' + '/klv';
	                break;
	            default:
	            	throw new Error('Undefined quality: ' + quality);
	            }


                // Set binary loading flag so the loading may be aborted
                if (!_binaryIsLoading[id]) {
                    _binaryIsLoading[id] = {};
                }
                _binaryIsLoading[id][quality] = true;

	            // download klv, extract metadata & decompress data to raw image
	            _cache[id][quality] = imageParserPool
	                .postMessage({
                        command: 'get',
                        url: url
                    })
	                .then(function(result) {
                        // Loading done

                        // Unset loading flag
                        _binaryIsLoading[id][quality] = false;

	                    // configure cornerstone related object methods
	                    var cornerstoneImageObject = wvCornerstoneImageAdapter.process(id, quality, result.cornerstoneMetaData, result.pixelBuffer, result.pixelBufferFormat);

	                    // trigger binaryLoaded event
	                    service.onBinaryLoaded.trigger(id, quality, cornerstoneImageObject);

	                    return cornerstoneImageObject;
	                })
                    .then(null, function(err) {
                        // Loading aborted

                        // Unset loading flag
                        _binaryIsLoading[id][quality] = false;

                        // This is called even when the error comes from the adapter (promise <.then(null, function(err) {...})> syntax)
                        // to be sure the promise is uncached anytime the promise is rejected

                        // Remove promise from cache / Uncount reference
                        _cacheReferenceCount[id][quality] = 1; // Reset the reference count to 1 so aborted loading do not have to be freed
                        service.free(quality);

                        // Propagate promise error
                        throw err;
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

        function abortLoading(id, quality) {
            // Cancel request if pending
            if (_binaryIsLoading[id][quality]) {
                // Retrieve the url (needed by the pool to retrieve the thread loading the image)
                // @todo put in worker
                var splitted = id.split(':');
                var instanceId = splitted[0];
                var frameIndex = splitted[1] || 0;

                var url = null;
                switch (quality) {
                case WvImageQualities.J100:
                    url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/8bit' + '/jpeg:100' + '/klv';
                    break;
                case WvImageQualities.R1000J100:
                    url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:1000' + '/8bit' + '/jpeg:100' + '/klv';
                    break;
                case WvImageQualities.R150J100:
                    url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:150' + '/8bit' + '/jpeg:100' + '/klv';
                    break;
                default:
                    throw new Error('Undefined quality: ' + quality);
                }
                
                // Abort the url loading @todo
                imageParserPool
                   .postMessage({
                       command: 'abort',
                       url: url
                   });

                // Note the loading flag is unset by the promise (see wvImageBinaryManager#get(id, quality))
                // The cache is also removed by the promise
            }

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

            // Cancel request if pending
            if (_cacheReferenceCount[id][quality] === 0 && _binaryIsLoading[id][quality]) {
                // Retrieve the url (needed by the pool to retrieve the thread loading the image)
                // @todo put in worker
                var splitted = id.split(':');
	            var instanceId = splitted[0];
	            var frameIndex = splitted[1] || 0;

	            var url = null;
	            switch (quality) {
	            case WvImageQualities.J100:
	            	url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/8bit' + '/jpeg:100' + '/klv';
	            	break;
	            case WvImageQualities.R1000J100:
	                url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:1000' + '/8bit' + '/jpeg:100' + '/klv';
	                break;
                case WvImageQualities.R150J100:
	                url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:150' + '/8bit' + '/jpeg:100' + '/klv';
	                break;
	            default:
	            	throw new Error('Undefined quality: ' + quality);
	            }
                
                // Abort the url loading @todo
                //imageParserPool
                //    .postMessage({
                //        command: 'abort',
                //        url: url
                //    });

                // Note the loading flag is unset by the promise (see wvImageBinaryManager#get(id, quality))
                // The cache is also removed by the promise
            }

            // Clean cache when no reference left
            if (_cacheReferenceCount[id][quality] === 0) {
                _cache[id][quality] = null;
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