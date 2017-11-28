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
    function wvMobileViewportTool($parse, WvBaseTool) {
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
        function MobileViewportToolVM($scope) {
            // Enable zoom via pinch
            WvBaseTool.call(this, 'zoomTouchPinch');

            // Cache hammer instances for memory clean up
            var _hammers = {};
            this._activateInputs = function(viewport) {
                // Call parent method
                WvBaseTool.prototype._activateInputs.apply(this, arguments);

                // Add windowing via 3 fingers
                // 1. Detect horiz. & vertical moves with three fingers
                var enabledElement = viewport.getEnabledElement();
                _hammers[viewport] = {};
                _hammers[viewport]["windowing"] = new Hammer(enabledElement);
                _hammers[viewport]["windowing"].get('pan').set({
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 3
                });
                // 2. Update window width
                _hammers[viewport]["windowing"].on("panup", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowWidth += 0.04 * viewportData.voi.windowWidth;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
                _hammers[viewport]["windowing"].on("pandown", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowWidth -= 0.04 * viewportData.voi.windowWidth;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
                // 3. Update window center
                _hammers[viewport]["windowing"].on("panleft", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowCenter += 0.04 * viewportData.voi.windowCenter;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
                _hammers[viewport]["windowing"].on("panright", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowCenter -= 0.04 * viewportData.voi.windowCenter;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });

                // Add panning via 2 fingers
                // 1. Detect horiz. & vertical moves with two fingers
                _hammers[viewport]["panning"] = new Hammer(enabledElement);
                _hammers[viewport]["panning"].get('pan').set({
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 1
                });
                var lastPanningCenter = null;
                _hammers[viewport]["panning"].on("pan", function(ev) {
                    if(ev.pointerType !== "touch"){
                        return;
                    }
                    if(lastPanningCenter === null){
                        // at the end of a pinch event, a panning event is fired, which will set the lastPanningCenter. To prevent it we check
                        // if the ev isFinal is not here to set it. It will prevent the image from bumping out at the next real panning event.
                        if(!ev.isFinal){
                            lastPanningCenter = ev.center;
                        }
                        return;
                    }
                    var viewportData = viewport.getViewport();
                    var deltaX, deltaY, scale;
                    scale = +viewportData.scale;
                    deltaX = ev.center.x -lastPanningCenter.x;
                    deltaY = ev.center.y -lastPanningCenter.y;
                    viewportData.translation.x += (deltaX / scale);
                    viewportData.translation.y += (deltaY / scale);
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                    lastPanningCenter = ev.center;
                    if(ev.isFinal){
                        lastPanningCenter = null;
                    }
                });
            };

            this._deactivateInputs = function(viewport) {
                // Call parent method
                WvBaseTool.prototype._deactivateInputs.apply(this, arguments);

                // Remove windowing listeners
                _hammers[viewport]["windowing"].destroy();
                _hammers[viewport]["panning"].destroy();
                delete _hammers[viewport];
            };

        }
        MobileViewportToolVM.prototype = Object.create(WvBaseTool.prototype);
        MobileViewportToolVM.prototype.constructor = MobileViewportToolVM;

        return directive;
    }

})();
