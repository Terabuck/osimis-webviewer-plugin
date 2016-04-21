(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvRotateViewportTool', wvRotateViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvRotateViewportTool'] = '?^wvRotateViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvRotateViewportTool($parse, WvBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvRotateViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvRotateViewportToolParser = $parse(attrs.wvRotateViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvRotateViewportToolParser, function(rotationDeg) {
                // rotationDeg = rotation degree

                tool.update(rotationDeg);
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

            this.update = function(rotationDeg) {
                this.viewports.forEach(function(viewport) {
                    var viewportData = viewport.getViewport();
                    viewportData.rotation = rotationDeg;
                    viewport.setViewport(viewportData);
                });
            }
        }
        
        return directive;
    }

})();