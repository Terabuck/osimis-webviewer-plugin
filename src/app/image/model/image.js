(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImage', wvImage);

    /* @ngInject */
    function wvImage($http, $q, wvConfig, WVImageModel) {
        var _postProcessorClasses = {};
        var service = {
            /**
             * @public retrieve @RootAggregate image-model by image id
             */
            get: get,
            /**
             * @namespace private function used by @RootAggregate image-model at namespace level
             */
            getCompressedImage: getCompressedImage,
            /**
             * @public register a post processor
             */
            registerPostProcessor: registerPostProcessor
        };

        return service;

        ////////////////

        // @input id: string <slice-id>[|<processor>...]
        //    <slice-id>: *:\d+ (_instance_:_slice_)
        //    <processor>: <string>[~<string>...] (_name_~_param1_~_param2_...)
        function get(id) {
            // split between image id and postProcesses
            var splitted = id.split('|');
            id = id[0];
            var postProcessesStrings = id.splice(1);
            var postProcesses = [];
            postProcessesStrings.forEach(function (processString) {
                // split processString between process name and its arguments
                splitted = processString.split('~');
                var processName = splitted[0];
                var processArgs = splitted.splice(1);

                var postProcessObject = new (Function.prototype.apply(_postProcessorClasses[processName], processArgs));
                postProcesses.push(postProcessObject);
            })

            // split between dicom instance id and frame index
            splitted = id.split(':');
            var instanceId = splitted[0];
            var frameIndex = splitted[1] || 0;
            
            // return results
			return $http
                .get(wvConfig.orthancApiURL + '/instances/'+instanceId+'/simplified-tags')
				.then(function(response) {
				    var tags = response.data;
                    return new WVImageModel(id, tags, postProcesses);
				});
        }

        
        function registerPostProcessor(name, PostProcessor) {
            _postProcessorClasses[name] = PostProcessor;
        }


        function getCompressedImage(id) {
            var compression = wvConfig.defaultCompression;
            id = id.split(':');
            var instanceId = id[0];
            var frameIndex = id[1];
            return $http
                .get(wvConfig.webviewerApiURL + '/instances/' +compression+ '-' + instanceId + '_' + frameIndex)
                .then(function(response) {
                    return response.data;
                });
        }

    }
})();
