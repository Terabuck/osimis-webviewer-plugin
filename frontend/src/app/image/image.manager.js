(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageManager', wvImageManager);

    /* @ngInject */
    function wvImageManager($rootScope, $q, $compile, $timeout, wvInstanceManager, WvImage) {
        var service = {
            /**
             * Retrieve an image model by id.
             * 
             * @pre The image's series has been loaded via wvSeriesManager
             * 
             * @param {string} id Id of the image
             *   format: <slice-id>[|<processor>...]
             *      * <slice-id>:  *:\d+ (_instance_:_slice_)
             *      * <processor>: <string>[~<string>...] (_name_~_param1_~_param2_...)
             * 
             * @return {promise<WvImageModel>}
             */
            get: get,
            /**
             * Retrieve an image picture from an image id.
             * 
             * @todo should be in @RootAggregate (ie. image-model)
             * 
             * @param {string} id Id of the image
             * @param {int} width Width of the output
             * @param {int} height Height of the output
             * 
             * @return {promise<string>} Resulting image in PNG as a DATA URI string
             */
            createAnnotedImage: createAnnotedImage,
            /**
             * Register a post processor
             *
             * @depracated
             */
            registerPostProcessor: registerPostProcessor
        };
    
        var postProcessorClasses = {};

        // @todo flush
        var _modelCache = {};

        /** _availableQualities
         *
         * Cache available qualities by instanceId when a series is loaded,
         * because all images' available qualities are only retrieved in one single series http request
         * to avoid unnecessary http requests.
         *
         */
        // @todo flush
        var _availableQualities = {};

        $rootScope.$on('SeriesHasBeenLoaded', function(evt, series) {
            var instanceIds = series.listInstanceIds();
            instanceIds.forEach(function(instanceId) {
                _availableQualities[instanceId] = series.availableQualities;
            });
        });

        return service;

        ////////////////
        
        function get(id) {
            var _this = this;

            if (!_modelCache.hasOwnProperty(id)) {
                // Split between image id and postProcesses
                var splitted = id.split('|');
                id = splitted[0];
                var postProcessesStrings = splitted.splice(1);
                var postProcesses = postProcessesStrings.map(function (processString) {
                    // Split processString between process name and its arguments
                    splitted = processString.split('~');
                    var processName = splitted[0];
                    var processArgs = splitted.splice(1);

                    if (!postProcessorClasses.hasOwnProperty(processName)) {
                        throw new Error('wv-image: unknown post processor');
                    }
                    
                    var postProcessObject = new (Function.prototype.bind.apply(postProcessorClasses[processName], [null].concat(processArgs)));
                    return postProcessObject;
                });

                // Split between dicom instance id and frame index
                splitted = id.split(':');
                var instanceId = splitted[0];
                var frameIndex = splitted[1] || 0;

                // Retrieve available qualities
                var availableQualities = _availableQualities[instanceId];
                if (!availableQualities) {
                    throw new Error("Image availableQualities is unavalaible: image's series has not been loaded.");
                }
                
                // Create & return image model based on request results
                _modelCache[id] = wvInstanceManager
                    .getTags(instanceId)
                    .then(function(tags) {
                        return new WvImage(_this, id, tags, availableQualities, postProcesses);
                    });
            };

            return _modelCache[id];
        };

        function registerPostProcessor(name, PostProcessor) {
            postProcessorClasses[name] = PostProcessor;
        }

        function createAnnotedImage(id, width, height) {
            // create a fake viewport containing the image to save it with the annotations

            // create a fake scope for the viewport
            var $scope = $rootScope.$new();
            $scope.size = {
                width: width + 'px',
                height: height + 'px'
            };
            $scope.imageId = id;

            var fakeViewport = $compile([
                '<wv-viewport id="FAKE-VIEWPORT-USED-IN-IMAGE-SERVICE"',
                    'wv-image-id="imageId"',
//                    'wv-viewport="$viewport"',
                    'wv-size="size"',
                    'wv-enable-overlay="false"',

                    'wv-angle-measure-viewport-tool="true"',
                    'wv-length-measure-viewport-tool="true"',
                    'wv-elliptical-roi-viewport-tool="true"',
                    'wv-zoom-viewport-tool="true"',
                    'wv-pan-viewport-tool="true"',
                    'wv-pixel-probe-viewport-tool="true"',
                    'wv-rectangle-roi-viewport-tool="true"',
//                    'wv-invert-contrast-viewport-tool="???"',
                '>',
                    // '<wv-overlay wv-tags="$image.tags" wv-viewport="$viewport" wv-show-timeline="false"></wv-overlay>',
                '</wv-viewport>'
            ].join('\n'))($scope);

            // happend the element to the body as it is required to define its size
            // make sure it's harmless
            var body = $('body');
            var _oldBodyOverflow = body.css('overflow');
            body.css('overflow', 'hidden');
            fakeViewport.css('position', 'absolute');
            fakeViewport.css('left', '-50000px');
            body.append(fakeViewport)

            function _destroyFakeViewport() {
                // revert body state
                body.css('overflow', _oldBodyOverflow);
                
                // remove element from body
                $('#FAKE-VIEWPORT-USED-IN-IMAGE-SERVICE').remove();

                // destroy useless scope
                $scope.$destroy();
            }


            // wait for the fakeViewport to have digested
            return $q(function(resolve, reject) {
                $timeout(function() {
                    var image = null;

                    // save the image to base64 data (96 dpi png image)
                    var canvas = fakeViewport.find('canvas').get(0);
                    image = canvas.toDataURL();

                    _destroyFakeViewport();

                    resolve(image);
                });
            })
        }

    }

})();

