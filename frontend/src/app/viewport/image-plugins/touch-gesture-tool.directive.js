/**
 *
 * @description
 * The `wvMobileViewportTool` directive attribute is a `wvViewport` directive
 * plugin. Since the toolbar is disabled on mobile, all the basic mobiles
 * interactions are enabled via this single tool.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvMobileViewportTool', wvMobileViewportTool)  // TODO:: rename into wvTouchGestureTool. For some weird reason, if the name is not wvMobileViewportTool it does not work (even with the modification in the webviewer.directive.html)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvMobileViewportTool'] = '?^wvMobileViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvMobileViewportTool($parse, WvBaseTool, wvConfig) {
        var directive = {
            require: 'wvMobileViewportTool',
            controller: MobileViewportToolVM,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            // bind attributes -> tool
            var wvMobileViewportToolParser = $parse(attrs.wvMobileViewportTool);
            scope.$watch(wvMobileViewportToolParser, function(isActivated) {
                if (isActivated) {
                    tool.activate();
                }
                else {
                    tool.deactivate();
                }
            });
        }

        /* @ngInject */
        function MobileViewportToolVM($scope, wvConfig, wvPanViewportTool, wvWindowingViewportTool, wvZoomViewportTool) {
            // Enable zoom via pinch
            WvBaseTool.call(this, 'zoomTouchPinch');  // this somehow enables the zoom tool of cornerstone

            // Cache hammer instances for memory clean up
            var _hammers = {};
            this._activateInputs = function(viewport) {
                var _this = this;
                // Call parent method
                WvBaseTool.prototype._activateInputs.apply(this, arguments);

                // Add windowing
                // 1. Detect pan movements with one finger
                var enabledElement = viewport.getEnabledElement();

                _hammers[viewport] = {};
                _hammers[viewport]["windowing"] = new Hammer(enabledElement);
                _hammers[viewport]["windowing"].get('pan').set({
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 1
                });

                var last1TouchPanningCenter = null;
                _hammers[viewport]["windowing"].on("pan", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }

                    if(last1TouchPanningCenter === null){
                        // at the end of a pinch event, a panning event is fired, which will set the lastPanningCenter. To prevent it we check
                        // if the ev isFinal is not here to set it. It will prevent the image from bumping out at the next real panning event.
                        if(!ev.isFinal){
                            last1TouchPanningCenter = ev.center;
                        }
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    var deltaX, deltaY, scale;
                    scale = +viewportData.scale;
                    deltaX = ev.center.x -last1TouchPanningCenter.x;
                    deltaY = ev.center.y -last1TouchPanningCenter.y;
                    wvWindowingViewportTool.apply(viewport, deltaX, deltaY)

                    last1TouchPanningCenter = ev.center;
                    if(ev.isFinal){
                        last1TouchPanningCenter = null;
                    }

                    return;
                });


                // Add panning via 2 fingers
                // 1. Detect horiz. & vertical moves with two fingers
                _hammers[viewport]["panning"] = new Hammer(enabledElement);
                _hammers[viewport]["panning"].get('pan').set({
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 2
                });
                var last2TouchPanningCenter = null;
                _hammers[viewport]["panning"].on("pan", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }
                    if(last2TouchPanningCenter === null){
                        // at the end of a pinch event, a panning event is fired, which will set the lastPanningCenter. To prevent it we check
                        // if the ev isFinal is not here to set it. It will prevent the image from bumping out at the next real panning event.
                        if(!ev.isFinal){
                            last2TouchPanningCenter = ev.center;
                        }
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    var deltaX, deltaY, scale;
                    scale = +viewportData.scale;
                    deltaX = ev.center.x -last2TouchPanningCenter.x;
                    deltaY = ev.center.y -last2TouchPanningCenter.y;

                    wvPanViewportTool.apply(viewport, deltaX, deltaY)

                    last2TouchPanningCenter = ev.center;
                    if(ev.isFinal){
                        last2TouchPanningCenter = null;
                    }
                });

                // install mouse handler
                var $enabledElement = $(viewport.getEnabledElement());

                $enabledElement.on('mousedown.dvt', function(e) {
                    var isTouchEvent = !e.pageX && !e.pageY && !!e.originalEvent.touches;
                    var mouseButton = !isTouchEvent ? e.which : 1;
                    var lastX = !isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX;
                    var lastY = !isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY;

                    $(document).on('mousemove.dvt', function(e) {
                        // Prevent issues on touchscreens.
                        e.preventDefault();

                        $scope.$apply(function() {  // @todo necessary ?
                            var deltaX = (!isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX) - lastX;
                            var deltaY = (!isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY) - lastY;
                            lastX = !isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX;
                            lastY = !isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY;

                            if (mouseButton === 1) { // left-click + move
                                wvWindowingViewportTool.apply(viewport, deltaX, deltaY);
                            }
                            else if (mouseButton === 2) { // middle-click + move
                                wvPanViewportTool.apply(viewport, deltaX, deltaY);
                            }
                            else if (mouseButton === 3) { // right-click + move
                                wvZoomViewportTool.apply(viewport, deltaY);
                            }
                        });

                        $(document).one('mouseup', function(e) {
                            $(document).unbind('mousemove.dvt');
                        });
                    });
                });


            };

            this._deactivateInputs = function(viewport) {
                // Call parent method
                WvBaseTool.prototype._deactivateInputs.apply(this, arguments);

                // Remove windowing listeners
                _hammers[viewport]["windowing"].destroy();
                _hammers[viewport]["panning"].destroy();
                delete _hammers[viewport];

                // Remove mouse handlers
                var $enabledElement = $(viewport.getEnabledElement());
                $enabledElement.off('mousedown.dvt');
            };
        }
        MobileViewportToolVM.prototype = Object.create(WvBaseTool.prototype);
        MobileViewportToolVM.prototype.constructor = MobileViewportToolVM;

        return directive;
    }

})();
