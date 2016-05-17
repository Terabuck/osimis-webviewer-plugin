(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvVflipViewportTool', wvVflipViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvVflipViewportTool'] = '?^wvVflipViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvVflipViewportTool($parse, WvBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvVflipViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvVflipViewportToolParser = $parse(attrs.wvVflipViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvVflipViewportToolParser, function(isActivated) {
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

            WvBaseTool.call(this, 'vflip');
            // @todo use .apply 

            this._process = function(viewport) {
                // set viewport selection overlay
                var onViewportSelectedCallback = _onViewportSelected.bind(this);
                viewport.enableSelection(onViewportSelectedCallback);
            };

            this._unprocess = function(viewport) {
                // disable all viewport selections
                this.viewports.forEach(function(viewport) {
                    viewport.disableSelection();
                });
            };

            function _onViewportSelected(viewport) {
                // apply flip
                var viewportData = viewport.getViewport();
                viewportData.vflip = !viewportData.vflip;
                viewport.setViewport(viewportData);
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