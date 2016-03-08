(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvDefaultViewportTool', wvDefaultViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvDefaultViewportTool'] = '?^wvDefaultViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvDefaultViewportTool($, $parse, WVBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
        	require: 'wvDefaultViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvDefaultViewportToolParser = $parse(attrs.wvDefaultViewportTool);

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
            WVBaseTool.call(this, 'default');

            this._activateInputs = function(viewport) {
                var _this = this;
                var $enabledElement = $(viewport.getEnabledElement());

                $enabledElement.on('mousedown.dvt', function(e) {
                    var lastX = e.pageX;
                    var lastY = e.pageY;
                    var mouseButton = e.which;

                    $(document).on('mousemove.dvt', function(e) {
                        $scope.$apply(function() {  // @todo necessary ?
                            var deltaX = e.pageX - lastX; 
                            var deltaY = e.pageY - lastY;
                            lastX = e.pageX;
                            lastY = e.pageY;

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

                        $(document).one('mouseup', function(e) {
                            $(document).unbind('mousemove.dvt');
                        });
                    });
                });
            };

            this._deactivateInputs = function(viewport) {
                var $enabledElement = $(viewport.getEnabledElement());
                $enabledElement.off('mousedown.dvt');
            };

            this._listenModelChange = angular.noop;
            this._unlistenModelChange = angular.noop;
            this._listenViewChange = angular.noop;
            this._unlistenViewChange = angular.noop;

            this.setWindowing = function(viewport, deltaX, deltaY) {
                var viewportData = viewport.getViewport();

                var scale = +viewportData.scale;
                var windowWidth = +viewportData.voi.windowWidth;
                var windowCenter = +viewportData.voi.windowCenter;

                viewportData.voi.windowWidth = windowWidth + (deltaX / scale);
                viewportData.voi.windowCenter = windowCenter + (deltaY / scale);
                
                viewport.setViewport(viewportData);
            };

            this.pan = function(viewport, deltaX, deltaY) {
                var viewportData = viewport.getViewport();

                var scale = +viewportData.scale;
                var x = +viewportData.translation.x;
                var y = +viewportData.translation.y;

                viewportData.translation.x = x + (deltaX / scale);
                viewportData.translation.y = y + (deltaY / scale);
                
                viewport.setViewport(viewportData);
            };

            this.zoom = function(viewport, deltaY) {
                var viewportData = viewport.getViewport();
                var scale = +viewportData.scale;

                viewportData.scale = scale + (deltaY / 100);

                viewport.setViewport(viewportData);
            };
        }
        Controller.prototype = Object.create(WVBaseTool.prototype)
        Controller.prototype.constructor = Controller;

        return directive;
    }
})();