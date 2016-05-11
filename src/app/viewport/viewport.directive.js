(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvViewport', wvViewport)
        .run(function($q) {
            // Inject $q in Viewport model
            osimis.Viewport.$q = $q;
        })
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
                 * This is usefull to avoid useless dual redrawing when the data changes because the image also changes.
                 *
                 * As long as the listener onImageChanging is used instead of onImageChanged,
                 * the drawing will occurs after the tool reloading,
                 *
                 */
                if (typeof redraw === 'undefined') redraw = true;

                this.toolState[imageId] = this.toolState[imageId] || {};
                
                // Merge the data into cornernerstone
                // We can't simply change the object references because cornerstone would lose link to the handles it's working on.
                // Strange behavior: merge seems to handle property deletion as well
                _.merge(this.toolState[imageId][toolName], state);
                
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
            var model = new osimis.Viewport(wvImageManager, enabledElement);

            scope.vm.wvEnableOverlay = !!scope.vm.wvEnableOverlay;
            var wvImageIdParser = $parse(attrs.wvImageId);

            // bind directive's sizing (via wv-size controller) to cornerstone
            {
                var wvSizeCtrl = ctrls.wvSize;
                var unbindWvSize = _bindWvSizeController(wvSizeCtrl, model);
            }

            // bind directive's controller to cornerstone (via directive's attributes)
            var _cancelCyclicCall = false; // cancel databinding induced by controller calls
            {
                var ctrl = ctrls.wvViewport;
                ctrl.getImage = function() {
                    return model.getImageId();
                };
                ctrl.setImage = function(id, resetParameters) { // resetParameters is optional
                    _cancelCyclicCall = true;

                    scope.vm.wvImageId = id;

                    return model.setImage(id, resetParameters);
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
