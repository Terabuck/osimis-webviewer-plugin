(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvViewport', wvViewport)
        .run(function(cornerstoneTools) {
            // extend the cornerstone toolStateManager

            var toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();
            toolStateManager.getStateByToolAndImageId = function(toolName, imageId) {
                return this.toolState[imageId] && this.toolState[imageId][toolName];
            };
            toolStateManager.restoreStateByToolAndImageId = function(toolName, imageId, state, redraw) {
                /**
                 *
                 * @param redraw: boolean (default: true)
                 *
                 * You can choose to not redraw the image after updating the tools data.
                 * This is usefull when the tools change because the image is changing.
                 *
                 * As long as the listener onImageChanging is used instead of onImageChanged,
                 * the drawing will occurs after the tool reloading,
                 *
                 */
                if (typeof redraw === 'undefined') redraw = true;

                this.toolState[imageId] = this.toolState[imageId] || {};
                this.toolState[imageId][toolName] = state;
                
                if (redraw) {
                    // refresh viewports
                    var enabledElementObjects = cornerstone.getEnabledElementsByImageId(imageId);
                    enabledElementObjects.forEach(function(enabledElementObject) {
                        var enabledElement = enabledElementObject.element;
                        cornerstone.draw(enabledElement);
                    });
                }
            };
            cornerstoneTools.globalImageIdSpecificToolStateManager = toolStateManager;
        });

    /* @ngInject */
    function wvViewport($, _, cornerstone, cornerstoneTools, $rootScope, $q, $parse, wvImageManager, WvImageQualities) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            transclude: true,
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            templateUrl: 'app/viewport/viewport.directive.html',
            link: link,
            restrict: 'E',
            require: {
                'wvViewport': 'wvViewport',
                'wvSize': '?wvSize'
            },
            scope: {
                wvImageId: '=?',
                wvImage: '=?',
                wvOnImageChange: '&?',
                wvViewport: '=?',
                wvEnableOverlay: '=?'
            }
        };

        /**
         * responsibility: manage directive's information flow
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
            var enabledElement = element.children('.wv-cornerstone-enabled-image')[0];
            var model = new ViewportViewModel(wvImageManager, enabledElement);

            scope.vm.wvEnableOverlay = !!scope.vm.wvEnableOverlay;
            var wvImageIdParser = $parse(attrs.wvImageId);

            // bind directive's sizing (via wv-size controller) to cornerstone
            {
                var wvSizeCtrl = ctrls.wvSize;
                var unbindWvSize = _bindWvSizeController(wvSizeCtrl, model);
            }

            // bind directive's controller to cornerstone (via directive's attributes)
            {
                var ctrl = ctrls.wvViewport;
                ctrl.getImage = function() {
                    return model.getImageId();
                };
                ctrl.setImage = function(id, reset) { // reset is optional
                    scope.vm.wvImageId = id;

                    return model.setImage(id, reset);
                };
                ctrl.clearImage = function() {
                    scope.vm.wvImageId = null;
                };
            }

            // bind directive's attributes to cornerstone
            {
                scope.$watch('vm.wvImageId', function (wvImageId, old) {
                    if (!wvImageId) {
                        model.clearImage();
                    }
                    else {
                        model.setImage(wvImageId);
                    }
                });
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
                    scope.vm.wvViewport = args.viewport;
                });
            });
            // cornerstone.
                // bind cornerstone viewport
                // scope.vm.wvViewport

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
                    model.resizeViewport(element.width(), element.height());
                    return null;
                }

                //model.resizeViewport(wvSizeController.getWidthInPixel(), wvSizeController.getHeightInPixel());
                var unlistenWvSizeFn = wvSizeController && wvSizeController.onUpdate(function() {
                    var width = wvSizeController.getWidthInPixel();
                    var height = wvSizeController.getHeightInPixel();

                    model.resizeViewport(width, height);
                });

                return function unbind() {
                    unlistenWvSizeFn();
                }
            }
            
            /** register tools
             *
             * Tool directiev spec:
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

        /**
         * responsibility: manage cornerstone viewport
         */
        function ViewportViewModel(wvImageManager, enabledElement) {
            var _this = this;

            this._imageManager = wvImageManager;
            this._enabledElement = enabledElement;

            this._imageId = null;
            this._image = null;
            this._viewportWidth = null;
            this._viewportHeight = null;
            this._cancelImageDisplaying = null;

            // store the resolutionScale to scale image back when image resolution changes
            this._resolutionScale = null;
    
            this.onImageChanging = new osimis.Listener();
            this.onImageChanged = new osimis.Listener();
            this.onViewportResetting = new osimis.Listener();

            cornerstone.enable(enabledElement);
        }
        
        ViewportViewModel.prototype.onImageChanging = angular.noop;
        ViewportViewModel.prototype.onImageChanged = angular.noop;
        
        ViewportViewModel.prototype.destroy = function() {
            if (this._cancelImageDisplaying) {
                this._cancelImageDisplaying();
            }
            cornerstone.disable(this._enabledElement);
        };

        ViewportViewModel.prototype.getEnabledElement = function() {
            return this._enabledElement;
        };
        
        // allow tools to reacts to click on the viewport
        // @todo move out ?
        ViewportViewModel.prototype.setSelectable = function(onSelectedCallback) {
            var _this = this;
            
            if (this._onViewportSelectedCallback) {
                throw new Error("viewport selection already active");
            }

            this._onViewportSelectedCallback = function() {
                onSelectedCallback(_this);
            };
            
            $(this._enabledElement).on('click', this._onViewportSelectedCallback);
        };
        ViewportViewModel.prototype.setUnselectable = function() {
            $(this._enabledElement).off('click', this._onViewportSelectedCallback);
            this._onViewportSelectedCallback = null;
        };

        ViewportViewModel.prototype.getViewport = function() {
            return cornerstone.getViewport(this._enabledElement);
        };
        ViewportViewModel.prototype.setViewport = function(viewport) {
            return cornerstone.setViewport(this._enabledElement, viewport);
        };

        ViewportViewModel.prototype.getImageId = function() {
            return this._imageId;
        };
        ViewportViewModel.prototype.getImage = function() {
            return this._image;
        };
        ViewportViewModel.prototype.setImage = function(id, reset) {
            if (id == this._imageId && !reset) {
                return $q.reject('This image is already shown');
            }
            
            reset = reset || false;

            // force reset when no previous data
            if (this._imageId === null) {
                reset = true;
            }

            var _this = this;

            this._imageId = id;

            if (this._cancelImageDisplaying) {
                this._cancelImageDisplaying();
            }

            var _cancelImageDisplaying = false;
            this._cancelImageDisplaying = function() {
                _cancelImageDisplaying = true;
                _this._cancelImageDisplaying = null;
            };

            // retrieve image model
            return _this._imageManager
                .get(id)
                .then(function (imageModel) {
                    // chose quality depending of viewport size
                    var qualityLevel = null;
                    if (_this._viewportWidth <= 150 || _this._viewportHeight <= 150) {
                        qualityLevel = WvImageQualities.R150J100;
                    }
                    else if (_this._viewportWidth <= 1000 || _this._viewportHeight <= 1000) {
                        qualityLevel = WvImageQualities.R1000J100;
                    }
                    else {
                        qualityLevel = WvImageQualities.J100;
                    }

                    var actualQualityLevel = null;

                    // redraw canvas when binary are available
                    imageModel.onBinaryLoaded(function(newQualityLevel, cornerstoneImageObject) {
                        var previousQualityLevel = actualQualityLevel;

                        // @note onBinaryLoaded can be triggered by another viewport using
                        // the same image (or even something else)

                        // only redraws viewport if required
                        if (newQualityLevel > previousQualityLevel && cornerstoneImageObject.qualityLevel <= qualityLevel) {
                            // update image
                            _updateImage(imageModel, cornerstoneImageObject);

                            // force redraw because image binary changes, even if param do not
                            cornerstone.invalidateImageId(imageModel.id);
                        }

                        // save the actual quality level to avoid drawing an inferior quality later
                        // this may occurs if another viewport load the same image with an inferior quality
                        actualQualityLevel = cornerstoneImageObject.qualityLevel;

                        // @todo allow cornerstone zoom to go behond 0.25
                    });
                    // @todo clean listener

                    // show the best already available binary
                    // use the *available* binary to avoid duplicate draw (one with the promise result, the other with the onBinaryLoaded event)
                    var cornerstoneImageObjectPromise = imageModel.getBinaryOfHighestQualityAvailable();
                    if (cornerstoneImageObjectPromise) {
                        // draw the image directly from the cache (even if the loading might not be finished, in this case the loading can be dual)
                        cornerstoneImageObjectPromise.then(function(cornerstoneImageObject) {
                            // update image
                            _updateImage(imageModel, cornerstoneImageObject);

                            // save the actual quality level to avoid drawing an inferior quality later
                            // this may occurs if another viewport load the same image with an inferior quality
                            actualQualityLevel = cornerstoneImageObject.qualityLevel;
                            
                            // load better quality if required
                            if (cornerstoneImageObject.qualityLevel < qualityLevel) {
                                imageModel.loadBinary(qualityLevel);
                            }
                        });
                        
                    }
    
                    // load binary if none is available at the moment
                    if (!cornerstoneImageObjectPromise) {
                        // if the quality desired is not available, load it - the event will draw it
                        imageModel.loadBinary(qualityLevel);
                    }

                    return imageModel;
                });
            
            function _updateImage(imageModel, cornerstoneImageObject) { // viewportData is optional
                var newImageModel = imageModel;
                var oldImageModel = _this._image;

                // reset the viewport data or gather them
                var viewportData = null;
                if (reset) {
                    viewportData = _this.resetViewport(cornerstoneImageObject);
                    
                    // keep resetting for when new resolutions of the same image are drawed
                }
                else  {
                    // get old viewportData
                    viewportData = cornerstone.getViewport(_this._enabledElement);

                    // rescale the image to its (possible) new resolution
                    var oldResolutionScale = _this._resolutionScale || 1;
                    var newResolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

                    // scale viewportData.scale from oldResolutionScale to newResolutionScale
                    var oldScale = viewportData.scale;
                    var newScale = oldScale / oldResolutionScale * newResolutionScale;
                    viewportData.scale = newScale;
                    
                    // issue: zoom is applied to translation.
                    // new resolution changes translation.
                    
                    // compensate the translation rescaling induced by image resolution change
                    var deltaScale = newScale / oldScale;
                    viewportData.translation.x = viewportData.translation.x / deltaScale;
                    viewportData.translation.y = viewportData.translation.y / deltaScale;

                    // save the resolutionScale further uses (eg. when image resolution change)
                    _this._resolutionScale = newResolutionScale;
                }

                // Trigger onImageChanging prior to image drawing
                // but after the viewport data is updated
                // Used to avoid multiple useless consecutive redrawing
                _this.onImageChanging.trigger(newImageModel, oldImageModel);
                
                // Display image
                cornerstone.displayImage(_this._enabledElement, cornerstoneImageObject, viewportData);
                $(_this._enabledElement).find('canvas').css('visibility', 'visible');

                // Trigger onImageChanged
                _this._image = newImageModel;
                _this.onImageChanged.trigger(newImageModel, oldImageModel);

                return newImageModel;
            }
        };
        
        ViewportViewModel.prototype.clearImage = function() {
            this._imageId = null;

            $(this._enabledElement).find('canvas').css('visibility', 'hidden');
        };
        ViewportViewModel.prototype.hasImage = function() {
            return this._imageId !== null;
        }

        ViewportViewModel.prototype.resizeViewport = function(width, height) {
            var jqEnabledElement = $(this._enabledElement);
            
            // save the viewport canvas size for ulterior uses (eg. know if an image is larger than its viewport)
            this._viewportWidth = width;
            this._viewportHeight = height;
            
            // set the canvas size
            jqEnabledElement.width(width);
            jqEnabledElement.height(height);

            // set the pixel quantity (? not sure it does that)
            cornerstone.resize(this._enabledElement, false);
            
            // draw & scale the image (if one is displayed)
            var csImage = cornerstone.getImage(this._enabledElement);
            var viewportData = cornerstone.getViewport(this._enabledElement);
            if (csImage && viewportData) {
                // rescale the image
                this._resetViewportScaleByImage(viewportData, csImage);
                // redraw it
                cornerstone.displayImage(this._enabledElement, csImage, viewportData);
            }
        };

        ViewportViewModel.prototype.resetViewport = function(csImage) {
            // get the base viewport data
            var viewportData = cornerstone.getDefaultViewportForImage(this._enabledElement, csImage);

            // rescale the image
            this._resetViewportScaleByImage(viewportData, csImage);

            // allow extensions to extend this behavior
            this.onViewportResetting.trigger(viewportData);

            return viewportData;
        };
        
        // updates viewportData
        ViewportViewModel.prototype._resetViewportScaleByImage = function(viewportData, cornerstoneImageObject) {
            var newResolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

            var isImageSmallerThanViewport = cornerstoneImageObject.originalWidth <= this._viewportWidth && cornerstoneImageObject.originalHeight <= this._viewportHeight;
            if (isImageSmallerThanViewport) {
                // show the image unscalled
                viewportData.scale = 1.0 * newResolutionScale;
            }
            else {
                // downscale the image to fit the viewport

                // choose the smallest between vertical and horizontal scale to show the entire image (and not upscale one of the two)

                var verticalScale = this._viewportHeight / cornerstoneImageObject.originalHeight * newResolutionScale;
                var horizontalScale = this._viewportWidth / cornerstoneImageObject.originalWidth * newResolutionScale;
                if(horizontalScale < verticalScale) {
                  viewportData.scale = horizontalScale;
                }
                else {
                  viewportData.scale = verticalScale;
                }
            }
            
            // also, reset the image position
            viewportData.translation.x = 0;
            viewportData.translation.y = 0;

            // save the resolutionScale for further uses (eg. image resolution change)
            this._resolutionScale = newResolutionScale;
        };

        return directive;
    }

    /**
     * responsibility: manage inter-directive communications
     *
     * @ngInject
     */
    function Controller($scope, $element, cornerstone, wvImageManager) {
        this.getImage = angular.noop;
        this.setImage = angular.noop;
        this.clearImage = angular.noop;
    }

})();
