(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvAngleMeasureViewportTool', wvAngleMeasureViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvAngleMeasureViewportTool'] = '?^wvAngleMeasureViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvAngleMeasureViewportTool($parse) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvAngleMeasureViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var wvAngleMeasureViewportToolParser = $parse(attrs.wvAngleMeasureViewportTool);

            scope.$watch(wvAngleMeasureViewportToolParser, function(isActivated) {
                if (isActivated) {
                    ctrl.activate();
                }
                else {
                    ctrl.deactivate();
                }
            });
        }
    }

    /* @ngInject */
    function Controller(cornerstoneTools) {
        var _enabledElements = [];
        
        this.isActivated = false;

        this.register = function(enabledElement) {
            _enabledElements.push(enabledElement);

            if (this.isActivated) {
                _activateFor(enabledElement);
            }
        };
        this.unregister = function(enabledElement) {
            _.pull(_enabledElements, enabledElement);
        };

        this.activate = function() {
            _enabledElements.forEach(function (enabledElement) {
                _activateFor(enabledElement);
            });

            this.isActivated = true;
        };
        this.deactivate = function() {
            _enabledElements.forEach(function (enabledElement) {
                _deactivateFor(enabledElement);
            });

            this.isActivated = false;
        };

        function _activateFor(enabledElement) {
            cornerstoneTools.mouseInput.enable(enabledElement);
            cornerstoneTools.angle.activate(enabledElement, true);
        }

        function _deactivateFor(enabledElement) {
            cornerstoneTools.angle.deactivate(enabledElement);
            cornerstoneTools.mouseInput.disable(enabledElement);
        }
    }
})();