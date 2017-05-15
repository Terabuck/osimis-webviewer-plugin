(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvHflipViewportTool', wvHflipViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvHflipViewportTool'] = '?^wvHflipViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvHflipViewportTool($parse, WvBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvHflipViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvHflipViewportToolParser = $parse(attrs.wvHflipViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvHflipViewportToolParser, function(isActivated) {
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

            WvBaseTool.call(this, 'hflip');

            this._process = function(viewport) {
                // set viewport selection overlay
                var onViewportSelectedCallback = this.onViewportSelected.bind(this);
                viewport.enableSelection(onViewportSelectedCallback);
            };

            this._unprocess = function(viewport) {
                // disable all viewport selections
                this.viewports.forEach(function(viewport) {
                    viewport.disableSelection();
                });
            };

            this.onViewportSelected = function(viewport) {
                // apply rotation
                var viewportData = viewport.getViewport();
                viewportData.hflip = !viewportData.hflip;
                viewport.setViewport(viewportData);
                viewport.draw(false);
            };

            this._listenViewChange = angular.noop;
            this._unlistenViewChange = angular.noop;
            this._activateInputs = angular.noop;
            this._deactivateInputs = angular.noop;
            this._listenModelChange = angular.noop;
            this._unlistenModelChange = angular.noop;
        }
        Controller.prototype = Object.create(WvBaseTool.prototype)
        Controller.prototype.constructor = Controller;
        
        return directive;
    }

})();