(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvInvertContrastViewportTool', wvInvertContrastViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvInvertContrastViewportTool'] = '?^wvInvertContrastViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvInvertContrastViewportTool($parse, WVBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvInvertContrastViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvInvertContrastViewportToolParser = $parse(attrs.wvInvertContrastViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvInvertContrastViewportToolParser, function(isActivated) {
                if (isActivated) {
                    tool.activate();
                }
                else {
                    tool.deactivate();
                }
            });
        }

        /* @ngInject */
        function Controller() {
            var _this = this;

            WVBaseTool.call(this, 'invertContrast');

            this._listenViewChange = function(viewport) {
                viewport.onViewportResetting(this, function(viewportData) {
                    viewportData.invert = _this.isActivated;
                });
            };
            this._unlistenViewChange = function(viewport) {
                viewport.onViewportResetting.close(this);
            };

            this._process = function(viewport) {
                var viewportData = viewport.getViewport();
                viewportData.invert = true;
                viewport.setViewport(viewportData);
            };

            this._unprocess = function(viewport) {
                var viewportData = viewport.getViewport();
                viewportData.invert = false;
                viewport.setViewport(viewportData);
            };

            this._activateInputs = angular.noop;
            this._deactivateInputs = angular.noop;
            this._listenModelChange = angular.noop;
            this._unlistenModelChange = angular.noop;
        }
        Controller.prototype = Object.create(WVBaseTool.prototype)
        Controller.prototype.constructor = Controller;
        
        return directive;
    }

})();