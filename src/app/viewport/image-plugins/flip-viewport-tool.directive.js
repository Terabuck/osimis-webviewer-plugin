(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvFlipViewportTool', wvFlipViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvFlipViewportTool'] = '?^wvFlipViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvFlipViewportTool($parse, WvBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvFlipViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvRotateViewportToolParser = $parse(attrs.wvFlipViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvRotateViewportToolParser, function(options) {
                // options = {horizontal: bool, vertical: bool}

                tool.update(options);
            }, true);
        }

        /* @ngInject */
        function Controller() {
            var _this = this;

            this.viewports = [];

            this.register = function(viewport) {
                this.viewports.push(viewport);
            };

            this.unregister = function(viewport) {
                _.pull(this.viewports, viewport);
            };

            this.update = function(options) {
                this.viewports.forEach(function(viewport) {
                    var viewportData = viewport.getViewport();
                    viewportData.hflip = options.horizontal;
                    viewportData.vflip = options.vertical;
                    viewport.setViewport(viewportData);
                });
            }
        }
        
        return directive;
    }

})();