/**
 * @ngdoc service
 *
 * @name wvInstanceManger
 *
 * @description
 * The `wvInstanceManager` provide information relative to image at the instance level. These are mainly the DICOM tags.
 * It is used by the image model, to retrieve tags. Most of the time, a image == a DICOM instance, but in case of multiframe instance,
 * one image == one DICOM frame. Therefore, `wvInstanceManager` is useful to cache things at the instance level.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvInstanceManager', wvInstanceManager);

    /* @ngInject */
    function wvInstanceManager($q, WvHttpRequest, wvConfig) {
        var service = {
        	/**
        	 * Retrieve a hash of tags for a specified instance.
        	 * 
        	 * @param {string} id Id of the instance (orthanc format)
        	 * 
        	 * @return {promise<object>} A hash of the tags (wrapped in promise)
        	 */
            getTags: getTags,
            /**
             * Set the tags of an instance.
             * 
             * Used mainly for optimization: retrieving all simplified tags at one single request within the wvSeriesManager
             * instead of many requests for each instances.
             *
             * @param {string} id The id of the instance (orthanc format)
             * @param {object} tags Object containing tags on format {tag1: content1, ...}
             */
            setTags: setTags
        };

        /**
         * Cache tags by instanceId when a series are loaded,
         * because all images' available qualities are only retrieved in one single series http request
         * to avoid unnecessary http requests.
         * 
         * @type {object}
         *    * keys: instance ids
         *    * values: tags request promises
         *    * format: {<orthancInstanceId>: <promiseOfTagsHash>, ...}
         *
         * @todo Flush the content
         */
        var _tagsByInstances = {};

        return service;

        ////////////////

        function getTags(id) {
        	// Load image tags if not already in loading
        	if (!_tagsByInstances.hasOwnProperty(id)) {
                var request = new WvHttpRequest();
                request.setHeaders(wvConfig.httpRequestHeaders);
                _tagsByInstances[id] = request
                    .get(wvConfig.orthancApiURL + '/instances/'+id+'/simplified-tags')
                    .then(function(response) {
                        var tags = response.data;

                        return tags;
                    }, function(err) {
                    	// @todo uncache & do something with the error
                    	
                    	return $q.reject(err);
                    });
            }

            // Return the tags
        	return _tagsByInstances[id];
        }

        function setTags(id, tags) {
        	// Always wrap tags in a promise to stay consistant with the API
        	tags = $q.when(tags);
        	
        	// Store the tags
            _tagsByInstances[id] = tags;
        }
    }
})();