(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageBinaryManager', wvImageBinaryManager)
        .constant('WvImageQualities', {
        	J95: 100,
			R150J95: 2 // resampling to 150 px + compressed to jpeg95
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
            hasCache: hasCache,
            getCachedHighestQuality: getCachedHighestQuality,
            onBinaryLoaded: new osimis.Listener() // (id, qualityLevel, cornerstoneImageObject)
        };

        ////////////////

        window.osimis.WorkerPool.createPromise = $q; // @todo move into class file
        var imageParserPool = new window.osimis.WorkerPool('/src/app/image/image-parser.async/main.js', 2);

        // _cache[imageId][qualityLevel] = cornerstoneImageObject
        // @note _cache[*] should always contains at least one item for hasCache method to work
        var _cache = {};

        /** wvImageBinaryManager#get(id, qualityLevel)
         *
         * @param id <instanceId>:<frameIndex>
         * @param qualityLevel see WvImageQualities
         * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
         *
         */
        function get(id, qualityLevel) {
        	// @todo handle cache better 

        	if (!_cache[id]) {
        		_cache[id] = {};
        	}

        	if (!_cache[id][qualityLevel]) {
	            var splitted = id.split(':');
	            var instanceId = splitted[0];
	            var frameIndex = splitted[1] || 0;

	            var url = null;
	            switch (qualityLevel) {
	            case WvImageQualities.J95:
	            	url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/8bit' + '/jpeg:95' + '/klv';
	            	break;
	            case WvImageQualities.R150J95:
	                url = wvConfig.orthancApiURL + '/nuks/' + instanceId + '/' + frameIndex + '/resize:150' + '/8bit' + '/jpeg:95' + '/klv';
	                break;
	            default:
	            	throw new Error('Undefined qualityLevel: ' + qualityLevel);
	            }

	            // download klv, extract metadata & decompress data to raw image
	            _cache[id][qualityLevel] = imageParserPool
	                .postMessage(url)
	                .then(function (result) {
	                    // configure cornerstone related object methods
	                    var cornerstoneImageObject = wvCornerstoneImageAdapter.process(id, qualityLevel, result.cornerstoneMetaData, result.pixelBuffer, result.pixelBufferFormat);

	                    // trigger binaryLoaded event
	                    service.onBinaryLoaded.trigger(id, qualityLevel, cornerstoneImageObject);

	                    return cornerstoneImageObject;
	                });
            }

            return _cache[id][qualityLevel];
        }

        /** wvImageBinaryManager#hasCache(id)
         *
         * @param id <instanceId>:<frameIndex>
         * @return boolean
         *
         * @pre // _cache[id] doesn't exists or contains at least one item
         *
         */
        function hasCache(id) {
        	return _cache.hasOwnProperty(id);
        }

        /** wvImageBinaryManager#getCachedHighestQuality(id)
         *
         * @param id <instanceId>:<frameIndex>
         * @return Promise<cornerstoneImageObject>
         *         returns a promise to avoid having duplicate pendant requests
         *         (the request is cached instead of the result)
         *
         */
        function getCachedHighestQuality(id) {
        	if (!_cache[id]) {
        		return null;
        	}

        	var highestQuality = _.max(_.keys(_cache[id]));
        	if (!highestQuality) {
        		return null;
        	}
        	else {
        		return _cache[id][highestQuality];
        	}
        }

        ////////////////

        return service;
    }
})();