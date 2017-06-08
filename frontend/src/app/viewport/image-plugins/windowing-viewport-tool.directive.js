(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvWindowingViewportTool', wvWindowingViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvWindowingViewportTool'] = '?^wvWindowingViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvWindowingViewportTool($, $parse, WvBaseTool) {
        var directive = {
        	require: 'wvWindowingViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvDefaultViewportToolParser = $parse(attrs.wvWindowingViewportTool);

            // bind attributes -> tool
            scope.$watch(wvDefaultViewportToolParser, function(isActivated) {
                if (isActivated) {
                    tool.activate();
                }
                else {
                    tool.deactivate();
                }
            });
        }

        /* @ngInject */
        function Controller($scope) {
            WvBaseTool.call(this, 'default');

            this._activateInputs = function(viewport) {
                var _this = this;
                var $enabledElement = $(viewport.getEnabledElement());

                $enabledElement.on('touchstart.dvt mousedown.dvt', function(e) {
                    var isTouchEvent = !e.pageX && !e.pageY && !!e.originalEvent.touches;
                    var mouseButton = !isTouchEvent ? e.which : 1;
                    var lastX = !isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX;
                    var lastY = !isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY;

                    $(document).on('touchmove.dvt mousemove.dvt', function(e) {
                        // Prevent issues on touchscreens.
                        e.preventDefault();

                        $scope.$apply(function() {  // @todo necessary ?
                            var deltaX = (!isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX) - lastX; 
                            var deltaY = (!isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY) - lastY;
                            lastX = !isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX;
                            lastY = !isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY;

                            if (mouseButton === 1) { // left-click + move
                                _this.setWindowing(viewport, deltaX, deltaY);
                            }
                            else if (mouseButton === 2) { // middle-click + move
                                _this.pan(viewport, deltaX, deltaY);
                            }
                            else if (mouseButton === 3) { // right-click + move
                                _this.zoom(viewport, deltaY);
                            }
                        });

                        $(document).one('touchstart mouseup', function(e) {
                            $(document).unbind('touchmove.dvt mousemove.dvt');
                        });
                    });
                });
            };

            this._deactivateInputs = function(viewport) {
                var $enabledElement = $(viewport.getEnabledElement());
                $enabledElement.off('touchstart.dvt mousedown.dvt');
            };

            this._listenModelChange = angular.noop;
            this._unlistenModelChange = angular.noop;
            this._listenViewChange = angular.noop;
            this._unlistenViewChange = angular.noop;

            this.setWindowing = function(viewport, deltaX, deltaY) {
                var viewportData = viewport.getViewport();

                // Retrieve image min/max image pixel value and define a
                // strength parameter proportional to the dynamic range of the
                // image, so high dynamic images have larger windowing changes
                // than low dynamic ones.
                var minPixelValue = viewport.getCurrentImageMinPixelValue();
                var maxPixelValue = viewport.getCurrentImageMaxPixelValue();
                var pixelValueDelta = maxPixelValue - minPixelValue;
                var strength = 1;
                strength += Math.log2(pixelValueDelta) - 9 || 1;

                // Retrieve the current scale of the image, so user has more
                // refined control over zoomed images. For instance, when user
                // zooms to a specific zone of a mammography, he wishes to
                // adjust the windowing more precisely than when he sees the
                // whole image. A better solution would be to define the
                // strength based on the currently viewed image zone dynamic, 
                // instead of the whole image dynamic, but that's fine for now.
                var scale = +viewportData.getScaleForFullResolution();

                // Calculate the new ww/wc.
                var newWindowWidth = +viewportData.voi.windowWidth + (deltaX / scale * strength);
                var newWindowCenter = +viewportData.voi.windowCenter + (deltaY / scale * strength);

                // Clamp windowing values to the min/max one availables, so 
                // image doesn't become invisible because of out of scope
                // value.
                if (newWindowWidth >= minPixelValue && newWindowWidth <= maxPixelValue) {
                    viewportData.voi.windowWidth = newWindowWidth;
                }
                if (newWindowCenter >= minPixelValue && newWindowCenter <= maxPixelValue) {
                    viewportData.voi.windowCenter = newWindowCenter;
                }
                
                // Update viewport values & redraw the viewport.
                viewport.setViewport(viewportData);
                viewport.draw(false);
            };

            this.pan = function(viewport, deltaX, deltaY) {
                var viewportData = viewport.getViewport();

                var scale = +viewportData.scale;
                var x = +viewportData.translation.x;
                var y = +viewportData.translation.y;

                viewportData.translation.x = x + (deltaX / scale);
                viewportData.translation.y = y + (deltaY / scale);
                
                viewport.setViewport(viewportData);
                viewport.draw(false);
            };

            this.zoom = function(viewport, deltaY) {
                var viewportData = viewport.getViewport();
                var scale = +viewportData.scale;

                viewportData.scale = scale + (deltaY / 100);

                viewport.setViewport(viewportData);
                viewport.draw(false);
            };
        }
        Controller.prototype = Object.create(WvBaseTool.prototype)
        Controller.prototype.constructor = Controller;

        return directive;
    }
})();