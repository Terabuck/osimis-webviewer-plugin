(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvPanViewportTool', wvPanViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvPanViewportTool'] = '?^wvPanViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvPanViewportTool($parse, WVBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvPanViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvPanViewportToolParser = $parse(attrs.wvPanViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvPanViewportToolParser, function(isActivated) {
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
            WVBaseTool.call(this, 'pan');

            this._activateInputs = function(viewport) {
                var _this = this;
                var $enabledElement = $(viewport.getEnabledElement());

                $enabledElement.on('mousedown.pan', function(e) {
                    var lastX = e.pageX;
                    var lastY = e.pageY;
                    var mouseButton = e.which;

                  // e.stopImmediatePropagation();

                    $(document).on('mousemove.pan', function(e) {
                        $scope.$apply(function() {
                            var deltaX = e.pageX - lastX; 
                            var deltaY = e.pageY - lastY;
                            lastX = e.pageX;
                            lastY = e.pageY;

                            if (mouseButton === 1) { // left-click + move
                                _this.pan(viewport, deltaX, deltaY);
                            };
                        });

                        $(document).one('mouseup', function(e) {
                            $(document).unbind('mousemove.pan');
                        });
                    });
                });
            };

            this._deactivateInputs = function(viewport) {
                var $enabledElement = $(viewport.getEnabledElement());
                $enabledElement.off('mousedown.pan');
            };

            this._listenModelChange = angular.noop;
            this._unlistenModelChange = angular.noop;
            this._listenViewChange = angular.noop;
            this._unlistenViewChange = angular.noop;
            
            this.pan = function(viewport, deltaX, deltaY) {
                var viewportData = viewport.getViewport();

                var scale = +viewportData.scale;
                var x = +viewportData.translation.x;
                var y = +viewportData.translation.y;

                viewportData.translation.x = x + (deltaX / scale);
                viewportData.translation.y = y + (deltaY / scale);
                
                viewport.setViewport(viewportData);
            };
        }
        Controller.prototype = Object.create(WVBaseTool.prototype)
        Controller.prototype.constructor = Controller;
        
        return directive;
    }

})();