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
        .directive('wvMobileViewportTool', wvMobileViewportTool)
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

            // Add windowing via 2 fingers
            this._activateInputs = function(viewport) {
                // Call parent method
                WvBaseTool.prototype._activateInputs.apply(this, arguments);

                // Add windowing via 2 fingers
                // 1. Detect horiz. & vertical moves with two fingers
                var enabledElement = viewport.getEnabledElement();
                _hammers[viewport] = new Hammer(enabledElement);
                _hammers[viewport].get('pan').set({
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 3
                });
                // 2. Update window width
                _hammers[viewport].on("panup", function(ev) {
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowWidth += 0.04 * viewportData.voi.windowWidth;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
                _hammers[viewport].on("pandown", function(ev) {
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowWidth -= 0.04 * viewportData.voi.windowWidth;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
                // 3. Update window center
                _hammers[viewport].on("panleft", function(ev) {
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowCenter += 0.04 * viewportData.voi.windowCenter;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
                _hammers[viewport].on("panright", function(ev) {
                    var viewportData = viewport.getViewport();
                    viewportData.voi.windowCenter -= 0.04 * viewportData.voi.windowCenter;
                    viewport.setViewport(viewportData);
                    viewport.draw(false);
                });
            };

            this._deactivateInputs = function(viewport) {
                // Call parent method
                WvBaseTool.prototype._deactivateInputs.apply(this, arguments);

                // Remove windowing listeners
                _hammers[viewport].destroy();
                delete _hammers[viewport];
            };

        }
        MobileViewportToolVM.prototype = Object.create(WvBaseTool.prototype)
        MobileViewportToolVM.prototype.constructor = MobileViewportToolVM;

        return directive;
    }

})();