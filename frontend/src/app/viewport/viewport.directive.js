/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewport
 *
 * @param {object} wvSize Please have a look at the `wvSize` directive source code for more information
 *
 * @param {string} [wvImageId]
 *   The id of the displayed image can be set using this attribute.
 *   It can also be set without attributes, using inter-directive communication. Therefore this attribute may be changed
 *   by the viewport itself (eg. when a series is dropped on the viewport).
 *   image_id = <orthanc-instance-id>:<frame-index> where frame-index = n ⊂ [0; 1000]
 *
 * @param {osimis.Image} [wvImage] (readonly)
 *   Share the image model instance.
 *   The viewport handles the image model loading. Therefore, it also provide access to it.
 *   This is done through this attribute, which should only be used to retrieve the model, not to set it.
 *
 * @param {string} [wvSeriesId]
 *   Please have a look at the `wvSeriesId` directive source code for more information
 *   concerning _wvSeriesId_ attribute, and other related attributes (for instance _wvSeries_ and _wvOnSeriesChange_).
 *
 * @param {callback} [wvOnImageChange]
 *   triggered when image has effectively changed
 *   
 *   Available Callback Arguments:
 *   * `$image` - image_model
 *
 * @param {object} wvViewport (readonly)
 *   Share the cornerstone viewport data. It is different from the viewport
 *   model which is only accessible via viewport plugins.
 *   
 *   The cornerstone viewport object contains the following attributes (source: https://github.com/chafey/cornerstone/wiki/viewport):
 *   * `scale` - The scale applied to the image. A scale of 1.0 will display no zoom (one image pixel takes up one screen pixel). A scale of 2.0 will be double zoom and a scale of .5 will be zoomed out by 2x
 *   * `translation` - an object with properties x and y which describe the translation to apply in the pixel coordinate system. Note that the image is initially displayed centered in the enabled element with a x and y translation of 0 and 0 respectively.
 *   * `voi` - an object with properties windowWidth and windowCenter.
 *   * `invert` - true if the image should be inverted, false if not.
 *   * `pixelReplication` - true if the image smooth / interpolation should be used when zoomed in on the image or false if pixel replication should be used.
 *   * `hflip` - true if the image is flipped horizontally. Default is false
 *   * `vflip` - true if the image is flipped vertically. Default is false
 *   * `rotation` - the rotation of the image (90 degree increments). Default is 0
 *
 * @param {boolean} [wvLossless=false] Force lossless quality fetching.
 *   * `false` - fetch image with quality based on viewport size.
 *   * `true` - fetch image with the maximum available quality.
 *   Note it doesn't disable progressive loading.
 *
 * @scope
 * @restrict Element
 * @requires webviewer.directive:wvSize
 * 
 * @description
 * The `wvViewport` directive display medical images inside a canvas.
 *
 * It is built to be extended by other directives. Have a look at the following folders
 * to discover how to use every viewport-related features:
 * - `wvSeriesId` is primarily used to display whole series instead of single images, please refer
 *   to the specific file for more information.
 * - _image-plugins/_ folder contains tools to add annotations to the viewport and to process it.
 * - _series-plugins/_ folder contains extensions relative to the series
 *
 * The wvSize directive must be used to set the size of the viewport element. See the corresponding documentation
 * for more information.
 *
 * An overlay is shown if the attribute wvEnableOverlay is set to true. The overlay show the
 * wvOverlay directive by default. It may be overloaded using standard transclusion. It is therefore
 * important to not put any whitespace between the DOM element's start and end tags, otherwise the default
 * overlay will be overloaded with white space.
 * By setting the overlay's css _position_ attribute to _absolute_, the ovgetViewporterlay can position information to the top, right, bottom and left sides
 * of the viewport.
 * 
 * @example
 * Display a specific image with some informations
 * 
 * ```html
 * <wv-viewport wv-image-id="'your-image-id" wv-image="$image" wv-size="{width: '100px', height: '100px'}"
 $              wv-viewport="$viewport" wv-lossless="true"
 * ></wv-viewport>
 * <p>{{$image.tags.PatientName}}</p>
 * <p>image position: {{$viewport.translate}}</p>
 * ```
 *
 * @example
 * Display a specific image with custom overlay
 * 
 * ```html
 * <wv-viewport wv-image-id="'your-image-id'" wv-image="$image" wv-size="{width: '100px', height: '100px'}"
 *              wv-viewport="$viewport" wv-lossless="true">
 *     <h1>My overloaded Overlay!</h1>
 *     <p style="position; absolute; bottom: 0;">
 *         {{$image.tags.PatientName}}
 *     </p>
 * </wv-viewport>
 * ```
 **/
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvViewport', wvViewport)
        .run(configureViewportModel)
        .run(extendCornerstoneToolStateManager);

    /**
     * Doc available at the head of the file
     * @ngInject
     */
    function wvViewport($, _, cornerstone, cornerstoneTools, $rootScope, $q, $parse, wvImageManager) {
        var directive = {
            transclude: true,
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            templateUrl: 'app/viewport/viewport.directive.html',
            link: link,
            restrict: 'E',
            require: {
                'wvViewportCtrl': 'wvViewport', // Ctrl postfix to avoid conflict w/ scope attribute
                'wvSizeCtrl': 'wvSize' // @todo make optional (by setting a canvas size equals to the shown image size)
            },
            scope: {
                wvImageId: '=?',
                wvImage: '=?',
                wvOnImageChange: '&?',
                wvViewport: '=?',
                wvEnableOverlay: '=?', // boolean [false]
                wvLossless: '@?' // boolean [false] - Always fetch lossless if true
            }
        };

        /**
         * @responsibility manage directive's information flow
         * 
         * dataflows: 
         *   directive's controller
         *     [command] -> controller -> attributes/$scope -> viewmodel -> cornerstone API -> [dom]
         *     [request] <- controller <- attributes/$scope <- viewmodel <- [out]
         *   directive's attributes
         *     [command] -> attributes/$scope -> viewmodel -> cornerstone API -> [dom]
         *     [request] <- attributes/$scope <- viewmodel <- [out]
         *   wv-size dependency
         *     [update] -> viewmodel -> cornerstone API -> [dom]
         */
        function link(scope, element, attrs, ctrls) {
            var enabledElement = element.children('div').children('.wv-cornerstone-enabled-image')[0];
            var model = new osimis.Viewport($q, cornerstone, enabledElement, !!scope.vm.wvLossless);

            scope.vm.wvEnableOverlay = !!scope.vm.wvEnableOverlay;
            var wvImageIdParser = $parse(attrs.wvImageId);

            // bind directive's sizing (via wv-size controller) to cornerstone
            {
                var wvSizeCtrl = ctrls.wvSizeCtrl;
                var unbindWvSize = _bindWvSizeController(wvSizeCtrl, model);
            }

            // bind directive's controller to cornerstone (via directive's attributes)
            var _cancelCyclicCall = false; // cancel databinding induced by controller calls
            {
                var ctrl = ctrls.wvViewportCtrl;
                ctrl.getImage = function() {
                    return model.getImageId();
                };
                ctrl.getModel = function() {
                    return model;
                }
                ctrl.setImage = function(id, resetParameters) { // resetParameters is optional
                    _cancelCyclicCall = true;

                    scope.vm.wvImageId = id;

                    return wvImageManager
                        .get(id)
                        .then(function(image) {
                            return model.setImage(image, resetParameters);
                        });
                };
                ctrl.clearImage = function() {
                    scope.vm.wvImageId = null;
                };
            }

            // bind directive's attributes to cornerstone
            {
                scope.$watch('vm.wvImageId', function (wvImageId, old) {
                    if (_cancelCyclicCall) {
                        _cancelCyclicCall = false;
                        return;
                    }

                    if (old && !wvImageId) {
                        model.clearImage();
                    }
                    else if (wvImageId) {
                        model.setImage(wvImageId);
                    }
                });

                // @todo @warning recursive loops?! performance hungry!
                scope.$watch('vm.wvViewport', function(wvViewport, old) {
                    // var wvViewport = scope.vm.wvViewport
                    if (_cancelCyclicCall) {
                        _cancelCyclicCall = false;
                        return;
                    }
                    if (wvViewport && wvViewport !== old) {
                        model.setViewport(wvViewport);
                    }
                }, true);
            }

            // bind model to directive's attributes
            // bind image
            model.onImageChanged(function(image) {
                scope.vm.wvImage = image;
                if (scope.vm.wvOnImageChange) {
                    scope.vm.wvOnImageChange({$image: image});
                }
            });
            element.on('CornerstoneImageRendered', function(evt, args) { // element.off not needed
                scope.$evalAsync(function() { // trigger a new digest if needed
                    _cancelCyclicCall = true;

                    // Copy the viewport, while making sure we don't change its
                    // reference though
                    _.merge(scope.vm.wvViewport, args.viewport);
                });
            });

            // unlisten binds
            scope.$on('$destroy', function() {
                if (unbindWvSize) {
                    unbindWvSize();
                    unbindWvSize = null;
                }
                model.destroy();
            });

            function _bindWvSizeController(wvSizeController, model) {
                if (!wvSizeController) {
                    // @todo resize based on image size and not on element size (wich is always 0)
                    model.resizeCanvas(element.width(), element.height());
                    return null;
                }

                //model.resizeCanvas(wvSizeController.getWidthInPixel(), wvSizeController.getHeightInPixel());
                var unlistenWvSizeFn = wvSizeController && wvSizeController.onUpdate(function resizeCanvas() {
                    var width = wvSizeController.getWidthInPixel();
                    var height = wvSizeController.getHeightInPixel();

                    model.resizeCanvas(width, height);
                });

                return function unbind() {
                    unlistenWvSizeFn();
                }
            }
            
            /** register tools
             *
             * Tool directive spec:
             * - name ends with ViewportTool
             * 
             * Tool controller interface:
             * - void register(ctrl)
             * - void unregister(ctrl)
             */
            // register the tools once there is an image
            model.onImageChanged.once(function(currentImage) {
                _forEachViewportTool(function(toolCtrl) {
                    toolCtrl.register(model);
                    scope.$on('$destroy', function() {
                        toolCtrl.unregister(model);
                    });
                });
            });
            function _forEachViewportTool(callback) {
                _.forEach(ctrls, function(ctrl, ctrlName) {
                    var ctrlIsTool = _.endsWith(ctrlName, 'ViewportTool');
                    if (!ctrl) {
                        return;
                    }
                    else if (ctrlIsTool) {
                        callback(ctrl, ctrlName);
                    }
                });
            }
        }        


        return directive;
    }

    /**
     * @responsibility manage inter-directive communications
     *
     * @ngInject
     */
    function Controller($scope, $element, cornerstone, wvImageManager) {
        this.getImage = angular.noop;
        this.setImage = angular.noop;
        this.clearImage = angular.noop;
    }

    /**
     * @responsibility inject the Viewport Model's dependencies
     *
     * It injects $q.
     *
     * @ngInject
     */
    function configureViewportModel($q) {
        // Inject $q in Viewport model
        osimis.Viewport.$q = $q;
    }

    /**
     * @responsibility extends the cornerstone toolStateManager
     *
     * The goal is primarily to enable polling off cornerstoneTools'
     * annotations so they can shared in real time.
     *
     * @ngInject
     */
    function extendCornerstoneToolStateManager(cornerstoneTools) {
        var toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();
        toolStateManager.getStateByToolAndImageId = function(toolName, imageId) {
            return this.toolState[imageId] && this.toolState[imageId][toolName];
        };

        /**
         * @param {boolean} [redraw=true]
         *
         * You can choose to not redraw the image after updating the tools data.
         * This is usefull to avoid useless dual redrawing when the data changes because the image also changes.
         *
         * As long as the listener onImageChanging is used instead of onImageChanged,
         * the drawing will occurs after the tool reloading,
         *
         * @description
         * Set the annotation data of a specific tool & image in cornerstone.
         */
        toolStateManager.restoreStateByToolAndImageId = function(toolName, imageId, state, redraw) {
            if (typeof redraw === 'undefined') redraw = true;

            // Merge the data into cornernerstone (if annotation is not removed)
            // We can't simply change the object references because cornerstone
            // would lose link to the handles it's working on.

            /**
             * @descriptiopn
             * Deep clone src in target but keep target's references.
             * Make sure both src & target are references (object/array).
             */
            function homemadeClone(src, target) {
                // If we are dealing with arrays, should work too since
                // changing length will erase values.

                // Remove src keys absent from target
                for (var prop in target) {
                    if (!src.hasOwnProperty(prop)) {
                        delete target[prop];
                    }
                }

                // Copy src content in target
                for (var prop in src) {
                    // Copy null value first (just to make sure null is not
                    // considered as an object).
                    if (src[prop] === null) {
                        target[prop] = null;
                    }
                    // Go recursively through nested object
                    else if (_.isObject(src[prop]) && !_.isArray(src[prop])) {
                        // Create an object in target if none
                        if (!_.isObject(target[prop])) {
                            target[prop] = {};
                        }
                        // Go deep
                        homemadeClone(src[prop], target[prop]);
                    }
                    // Go recursively through nested array
                    else if (_.isArray(src[prop])) {
                        // Create an array in target if none
                        if (!_.isArray(target[prop])) {
                            target[prop] = [];
                        }
                        // Go deep
                        homemadeClone(src[prop], target[prop]);
                    }
                    // Copy directly every other kind of value
                    else {
                        target[prop] = src[prop];
                    }
                }
            }

            // Remove the data from cornerstone (if all the related annotations 
            // are removed).
            if (!state && this.toolState[imageId] && this.toolState[imageId][toolName]) {
                delete this.toolState[imageId][toolName];
            }
            else {
                this.toolState[imageId] = this.toolState[imageId] || {};
                this.toolState[imageId][toolName] = this.toolState[imageId][toolName] || {};
                homemadeClone(state, this.toolState[imageId][toolName]);
            }

            if (redraw) {
                // refresh viewports
                var enabledElementObjects = cornerstone.getEnabledElementsByImageId(imageId);
                enabledElementObjects.forEach(function(enabledElementObject) {
                    var enabledElement = enabledElementObject.element;
                    // Redraw the image - don't use cornerstone#draw because bugs occurs (only when debugger is off)
                    // those issues may come from changing the cornerstoneImageObject when image resolution change (cornerstone probably cache it)
                    cornerstone.updateImage(enabledElement, true); // draw image & invalidate cornerstone cache
                    $(enabledElementObject.element).trigger("CornerstoneImageRendered", {
                        viewport: enabledElementObject.viewport,
                        element : enabledElementObject.element,
                        image : enabledElementObject.image,
                        enabledElement : enabledElementObject,
                        canvasContext: enabledElementObject.canvas.getContext('2d')
                    });
                });
            }
        };
        cornerstoneTools.globalImageIdSpecificToolStateManager = toolStateManager;
    }
})();
