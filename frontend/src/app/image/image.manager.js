/**
 * @ngdoc service
 *
 * @name webviewer.service:wvImageManager
 *
 * @description
 * Manage high-level image models.
 * An image correspond to a monoframe instance or to the frame of a multiframe
 * instance. One image may have multiple binaries (one by quality).
 * 
 * Available qualities may change from one instance to another within the same
 * series.
 */
(function(osimis) {
    'use strict';

    function ImageManager(instanceManager, imageBinaryManager, annotationManager) {
        this._instanceManager = instanceManager;
        this._imageBinaryManager = imageBinaryManager;
        this._annotationManager = annotationManager;

        this._postProcessorClasses = {};

        // @todo flush
        this._modelCache = {};

        /** _availableQualities
         *
         * Cache available qualities by instanceId when a series is loaded,
         * because all images' available qualities are only retrieved in one single series http request
         * to avoid unnecessary http requests (since retrieve available qualities involve opening the dicom
         * file to check the DICOM tag).
         */
        // @todo flush
        this._availableQualities = {}; // _availableQualities[instanceId] = series.availableQualities
    }

    /**
     * @ngdoc method
     * @methodOf webviewer.service:wvImageManager
     *
     * @name osimis.ImageManager#get
     * 
     * @param {string} id Id of the image (<instance-id>:<frame-index>)
     * @return {Promise<osimis.Image>} The image model's promise
     *
     * @description
     * Retrieve an image model by id.
     * 
     * # @pre The image's series has been loaded via wvSeriesManager
     */
    ImageManager.prototype.get = function(id) {
        var instanceManager = this._instanceManager;
        var postProcessorClasses = this._postProcessorClasses;
        var modelCache = this._modelCache;
        var availableQualities = this._availableQualities;
        var _this = this;

        if (!modelCache.hasOwnProperty(id)) {
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
            var availableQualities = availableQualities[instanceId];
            if (!availableQualities) {
                throw new Error("Image availableQualities is unavalaible: image's series has not been loaded.");
            }
            
            // Create & return image model based on request results
            modelCache[id] = instanceManager
                .getTags(instanceId)
                .then(function(tags) {
                    return new osimis.Image(_this._imageBinaryManager, _this._annotationManager,
                        id, tags, availableQualities, postProcesses);
                });
        };

        return modelCache[id];
    };

    /**
     * @ngdoc method
     * @methodOf webviewer.service:wvImageManager
     *
     * @name osimis.ImageManager#cacheAvailableQualitiesForInstance
     * 
     * @param {string} instanceId Id of the instance
     * @param {Array<osimis.quality>} availableQualities 
     *    List of the current instance's qualities available for download.
     *
     * @description
     * Cache available qualities by instanceId when a series is loaded, because
     * all images' available qualities are only retrieved in one single series
     * http request to avoid unnecessary http requests.
     */
    ImageManager.prototype.cacheAvailableQualitiesForInstance = function(instanceId, availableQualities) {
        this._availableQualities[instanceId] = availableQualities;
    }

    /**
     * Register a post processor
     *
     * @depracated
     */
    ImageManager.prototype.registerPostProcessor = function(name, PostProcessor) {
        var postProcessorClasses = this._postProcessorClasses;

        postProcessorClasses[name] = PostProcessor;
    };

    osimis.ImageManager = ImageManager;

    angular
        .module('webviewer')
        .factory('wvImageManager', wvImageManager);

    /* @ngInject */
    function wvImageManager($rootScope, $q, $compile, $timeout, wvInstanceManager, wvImageBinaryManager, wvAnnotationManager) {
        var imageManager = new ImageManager(wvInstanceManager, wvImageBinaryManager, wvAnnotationManager);

        // Cache available binary qualities for instance
        $rootScope.$on('SeriesHasBeenLoaded', function(evt, series) {
            var instanceIds = series.listInstanceIds();
            instanceIds.forEach(function(instanceId) {
                imageManager.cacheAvailableQualitiesForInstance(instanceId, series.availableQualities);
            });
        });

        /**
         * @ngdoc method
         * @methodOf webviewer.service:wvImageManager
         *
         * @name osimis.ImageManager#createAnnotedImage
         * 
         * @param {string} id Id of the image (<instance-id>:<frame-index>)
         * @param {int} width Width of the output
         * @param {int} height Height of the output
         *
         * @description
         * Retrieve an image picture from an image id.
         * 
         * @todo move in @RootAggregate (ie. image-model)
         */
        imageManager.createAnnotedImage = function(id, width, height) {
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
                    'wv-orientation-marker-viewport-tool',
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
        };

        return imageManager;
    }

})(this.osimis || (this.osimis = {}));