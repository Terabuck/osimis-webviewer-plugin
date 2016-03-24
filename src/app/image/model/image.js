(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImage', wvImage);

    /* @ngInject */
    function wvImage($http, $q, $compile, $timeout, $rootScope, wvConfig, WVImageModel) {
        var service = {
            get: get,
            getCompressedImage: getCompressedImage,
            createAnnotedImage: createAnnotedImage
        };
    
        // @todo flush somehow
        var modelCache = {};

        // @todo flush somehow
        var pixelCache = {};
        

        return service;

        ////////////////
        
        function get(id) {
            if (!modelCache.hasOwnProperty(id)) {
                var splittedId = id.split(':');
                var instanceId = splittedId[0];
                var frameIndex = splittedId[1] || 0;

                modelCache[id] = $http
                    .get(wvConfig.orthancApiURL + '/instances/'+instanceId+'/simplified-tags')
                    .then(function(response) {
                        var tags = response.data;
                        return new WVImageModel(id, tags);
                    });
            }

            return modelCache[id];
        };

        function getCompressedImage(id) {
            if (!pixelCache.hasOwnProperty(id)) {
                var compression = wvConfig.defaultCompression;
                id = id.split(':');
                var instanceId = id[0];
                var frameIndex = id[1];
                pixelCache[id] = $http
                    .get(wvConfig.webviewerApiURL + '/instances/' +compression+ '-' + instanceId + '_' + frameIndex)
                    .then(function(response) {
                        return response.data;
                    });
            }

            return pixelCache[id];
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
