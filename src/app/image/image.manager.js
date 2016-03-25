(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageManager', wvImageManager);

    /* @ngInject */
    function wvImageManager($http, $q, $compile, $timeout, $rootScope, wvConfig, WvImage, wvCornerstoneImageAdapter) {
        var service = {
            get: get,
            getPixelObject: getPixelObject,
            createAnnotedImage: createAnnotedImage,
            /**
             * @public register a post processor
             */
            registerPostProcessor: registerPostProcessor
        };
    
        var postProcessorClasses = {};

        // @todo flush somehow
        var modelCache = {};

        // @todo flush somehow
        var pixelCache = {};


        return service;

        ////////////////
        
        // @input id: string <slice-id>[|<processor>...]
        //    <slice-id>: *:\d+ (_instance_:_slice_)
        //    <processor>: <string>[~<string>...] (_name_~_param1_~_param2_...)
        function get(id) {
            var _this = this;

            if (!modelCache.hasOwnProperty(id)) {
                // split between image id and postProcesses
                var splitted = id.split('|');
                id = splitted[0];
                var postProcessesStrings = splitted.splice(1);
                var postProcesses = postProcessesStrings.map(function (processString) {
                    // split processString between process name and its arguments
                    splitted = processString.split('~');
                    var processName = splitted[0];
                    var processArgs = splitted.splice(1);

                    if (!postProcessorClasses.hasOwnProperty(processName)) {
                        throw new Error('wv-image: unknown post processor');
                    }
                    
                    var postProcessObject = new (Function.prototype.bind.apply(postProcessorClasses[processName], [null].concat(processArgs)));
                    return postProcessObject;
                });

                // split between dicom instance id and frame index
                splitted = id.split(':');
                var instanceId = splitted[0];
                var frameIndex = splitted[1] || 0;
                
                // return results
                modelCache[id] = $http
                    .get(wvConfig.orthancApiURL + '/instances/'+instanceId+'/simplified-tags')
                    .then(function(response) {
                        var tags = response.data;
                        return new WvImage(_this, id, tags, postProcesses);
                    });
            };

            return modelCache[id];
        };

        function getPixelObject(id) {
            if (!pixelCache.hasOwnProperty(id)) {
                var compression = wvConfig.defaultCompression;
                id = id.split(':');
                var instanceId = id[0];
                var frameIndex = id[1];
                pixelCache[id] = $http
                    .get(wvConfig.webviewerApiURL + '/instances/' +compression+ '-' + instanceId + '_' + frameIndex)
                    .then(function(response) {
                        return wvCornerstoneImageAdapter.process(id, response.data);
                    });
            }

            return pixelCache[id];
        }
        
        function registerPostProcessor(name, PostProcessor) {
            postProcessorClasses[name] = PostProcessor;
        }

        // @todo should be in @RootAggregate (ie. image-model)
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

                    // save the image to base64 data
                    var canvas = fakeViewport.find('canvas').get(0);
                    image = canvas.toDataURL();

                    _destroyFakeViewport();

                    resolve(image);
                });
            })
        }

    }
})();
