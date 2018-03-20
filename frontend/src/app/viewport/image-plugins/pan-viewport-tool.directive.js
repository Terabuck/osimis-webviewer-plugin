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
    function wvPanViewportTool($parse, WvBaseTool, wvPanViewportTool) {
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
            WvBaseTool.call(this, 'pan');

            this._activateInputs = function(viewport) {
                var _this = this;
                var $enabledElement = $(viewport.getEnabledElement());

                $enabledElement.on('touchstart.pan mousedown.pan', function(e) {
                    // Retrieve touch events if available.
                    var isTouchEvent = !e.pageX && !e.pageY && !!e.originalEvent.touches;
                    var mouseButton = !isTouchEvent ? e.which : 1;
                    var lastX = !isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX;
                    var lastY = !isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY;

                  // e.stopImmediatePropagation();

                    $(document).on('touchmove.pan mousemove.pan', function(e) {
                        $scope.$apply(function() {
                            var deltaX = (!isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX) - lastX; 
                            var deltaY = (!isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY) - lastY;
                            lastX = !isTouchEvent ? e.pageX : e.originalEvent.touches[0].pageX;
                            lastY = !isTouchEvent ? e.pageY : e.originalEvent.touches[0].pageY;

                            if (mouseButton === 1) { // left-click + move
                                wvPanViewportTool.applyPanToViewport(viewport, deltaX, deltaY);
                            };
                        });

                        $(document).one('touchstart mouseup', function(e) {
                            $(document).unbind('touchmove.pan mousemove.pan');
                        });
                    });
                });
            };

            this._deactivateInputs = function(viewport) {
                var $enabledElement = $(viewport.getEnabledElement());
                $enabledElement.off('touchstart.pan mousedown.pan');
            };

            this._listenModelChange = angular.noop;
            this._unlistenModelChange = angular.noop;
            this._listenViewChange = angular.noop;
            this._unlistenViewChange = angular.noop;
        }
        Controller.prototype = Object.create(WvBaseTool.prototype)
        Controller.prototype.constructor = Controller;
        
        return directive;
    }

})();