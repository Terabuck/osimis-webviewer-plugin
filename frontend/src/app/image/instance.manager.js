/**
 * @ngdoc service
 *
 * @name webviewer.service:wvInstanceManager
 *
 * @description
 * The `wvInstanceManager` provide information relative to image at the
 * instance level. These are mainly the DICOM tags. It is used by the image 
 * model, to retrieve tags. Most of the time, an image == a DICOM instance, but 
 * in case of multiframe instance, one image == one DICOM frame. Therefore,
 * `wvInstanceManager` is useful to cache things at the instance level.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvInstanceManager', wvInstanceManager);

    /* @ngInject */
    function wvInstanceManager($q, wvConfig) {
        var service = {
        	/**
             * @ngdoc method
             * @methodOf webviewer.service:wvInstanceManager
             *
             * @name osimis.InstanceManager#getTags
             * @param {string} id Id of the instance (orthanc format)
             * @return {promise<object>} A hash of the tags (wrapped in promise)
             * 
             * @description
        	 * Retrieve a hash of tags for a specified instance.
        	 */
            getTags: getTags,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvInstanceManager
             *
             * @name osimis.InstanceManager#setTags
             * 
             * @param {string} id 
             * The id of the instance (orthanc format).
             *
             * @param {object} tags
             * Object containing tags on format {tag1: content1, ...}
             *
             * @description
             * Set the tags of an instance.
             * 
             * Used mainly for optimization: retrieving all simplified tags at one single request within the wvSeriesManager
             * instead of many requests for each instances.
             */
            setTags: setTags,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvInstanceManager
             *
             * @name osimis.InstanceManager#onTagsSet
             * 
             * @param {function} callback
             * A callback function triggered each time a tag as been defined.
             * 
             * - @param {string} id
             * The id of the instance (orthanc format).
             *
             * - @param {object} tags
             * Object containing tags on format {tag1: content1, ...}
             * 
             * @description
             * A callback function triggered each time a tag as been defined.
             * 
             * Required as some part of the cornerstone API doesn't fit well
             * with the getter/setter we use (because they use promises).
             */
            onTagsSet: new osimis.Listener()
        };

        /**
         * Cache tags by instanceId when a series is loaded,
         * because all images' tags are only retrieved in one single series http request
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
        	// Load image tags if not already in loading.
        	if (!_tagsByInstances.hasOwnProperty(id)) {
                var request = new osimis.HttpRequest();
                request.setHeaders(wvConfig.httpRequestHeaders);
                _tagsByInstances[id] = request
                    .get(wvConfig.orthancApiURL + '/instances/'+id+'/simplified-tags')
                    .then(function(response) {
                        var tags = response.data;

                        return tags;
                    }, function(err) {
                    	// @todo uncache & do something with the error.
                    	
                    	return $q.reject(err);
                    });
            }

            // Return the tags.
        	return _tagsByInstances[id];
        }

        function setTags(id, tags) {
        	// Always wrap tags in a promise to stay consistant with the API.
        	var tagsPromise = $q.when(tags);
        	
        	// Store the tags.
            _tagsByInstances[id] = tagsPromise;

            // Trigger event.
            service.onTagsSet.trigger(id, tags);
        }
    }
})();