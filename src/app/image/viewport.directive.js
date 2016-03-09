(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvViewport', wvViewport)
        .run(function(cornerstoneTools) {
            var toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();
            toolStateManager.getStateByToolAndImageId = function(toolName, imageId) {
                return this.toolState[imageId] && this.toolState[imageId][toolName];
            };
            toolStateManager.restoreStateByToolAndImageId = function(toolName, imageId, state) {
                this.toolState[imageId] = this.toolState[imageId] || {};
                this.toolState[imageId][toolName] = state;
            };
            cornerstoneTools.globalImageIdSpecificToolStateManager = toolStateManager;
        });

    /* @ngInject */
    function wvViewport($, _, cornerstone, cornerstoneTools, $rootScope, $q, $parse, wvImage) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            transclude: true,
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            templateUrl: 'app/image/viewport.directive.tpl.html',
            link: link,
            restrict: 'E',
            require: {
                'wvViewport': 'wvViewport',
                'wvSize': '?wvSize'
            },
            scope: {
                wvImageId: '=?',
                wvImage: '=?',
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
            var model = new ViewportViewModel(wvImage, enabledElement);

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
        function ViewportViewModel(wvImageRepository, enabledElement) {
            var _this = this;

            this._imageRepository = wvImageRepository;
            this._enabledElement = enabledElement;

            this._imageId = null;
            this._image = null;
            this._viewportWidth = null;
            this._viewportHeight = null;
            this._cancelImageDisplaying = null;

            this.onImageChanged = new osimis.Listener();
            this.onViewportResetting = new osimis.Listener();

            cornerstone.enable(enabledElement);
        }

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
        ViewportViewModel.prototype.updateImage = function(reset) {
            if (!this.hasImage()) {
                return;
            }

            // @todo assert previousViewport should always exists
            //reset.call(this, ..., ..)
            
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
            // @todo true canceling
            return $q
                .all({
                    processedImage: cornerstone.loadImage('orthanc://' + id),
                    imageModel: _this._imageRepository.get(id)
                })
                .then(function(args) {
                    if (_cancelImageDisplaying) {
                        return $q.reject('wv-viewport: image displaying canceled');
                    }

                    var processedImage = args.processedImage;
                    var imageModel = args.imageModel;

                    var viewportData;
                    if (!reset) {
                        viewportData = cornerstone.getViewport(_this._enabledElement); // get old viewportData
                    }
                    else {
                        viewportData = _this.resetViewport(processedImage);
                    }

                    cornerstone.displayImage(_this._enabledElement, processedImage, viewportData);

                    $(_this._enabledElement).css('visibility', 'visible');

                    return args;
                })
                .then(function(args) {
                    if (_cancelImageDisplaying) {
                        return $q.reject('wv-viewport: image displaying canceled');;
                    }

                    var newImageModel = args.imageModel;
                    var oldImageModel = _this._image;
                    //var newViewport = args.newViewport;
                    //var oldViewport = args.oldViewport;

                    _this._image = newImageModel;
                    _this.onImageChanged.trigger(newImageModel, oldImageModel);//, newViewport, oldViewport);

                    return newImageModel;
                })
                ;
        };
        ViewportViewModel.prototype.clearImage = function() {
            this._imageId = null;

            $(this._enabledElement).css('visibility', 'hidden');
        };
        ViewportViewModel.prototype.hasImage = function() {
            return this._imageId !== null;
        }

        ViewportViewModel.prototype.resizeViewport = function(width, height) {
            var jqEnabledElement = $(this._enabledElement);

            this._viewportWidth = width;
            this._viewportHeight = height;

            jqEnabledElement.width(width);
            jqEnabledElement.height(height);
            cornerstone.resize(this._enabledElement, false);

            var csImage = cornerstone.getImage(this._enabledElement);
            var viewportData = cornerstone.getViewport(this._enabledElement);
            if (csImage && viewportData) {
                // rescale the image
                _setViewportScaleByImage(viewportData, this._viewportWidth, this._viewportHeight, csImage);
                // redraw it
                cornerstone.displayImage(this._enabledElement, csImage, viewportData);
            }
        };

        ViewportViewModel.prototype.resetViewport = function(csImage) {
            var viewportData = cornerstone.getDefaultViewportForImage(this._enabledElement, csImage);

            // rescale the image
            _setViewportScaleByImage(viewportData, this._viewportWidth, this._viewportHeight, csImage);

            // allow extensions to extend this behavior
            this.onViewportResetting.trigger(viewportData);

            return viewportData;
        };

        function _setViewportScaleByImage(viewportData, elementWidth, elementHeight, csImage) {
            var isImageSmallerThanViewport = csImage.width <= elementWidth && csImage.height <= elementHeight;
            if (isImageSmallerThanViewport) {
                viewportData.scale = 1.0;
            }
            else {
                var verticalScale = elementHeight / csImage.height;
                var horizontalScale = elementWidth / csImage.width;
                if(horizontalScale < verticalScale) {
                  viewportData.scale = horizontalScale;
                }
                else {
                  viewportData.scale = verticalScale;
                }
                viewportData.translation.x = 0;
                viewportData.translation.y = 0;
            }
        };

        return directive;
    }

    /**
     * responsibility: manage inter-directive communications
     *
     * @ngInject
     */
    function Controller($scope, $element, cornerstone, wvImage) {
        this.getImage = angular.noop;
        this.setImage = angular.noop;
        this.clearImage = angular.noop;
    }

})();
