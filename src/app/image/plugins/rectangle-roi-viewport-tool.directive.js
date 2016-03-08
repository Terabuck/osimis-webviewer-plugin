(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvRectangleRoiViewportTool', wvRectangleRoiViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvRectangleRoiViewportTool'] = '?^wvRectangleRoiViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvRectangleRoiViewportTool($parse, WVBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvRectangleRoiViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvRectangleRoiViewportToolParser = $parse(attrs.wvRectangleRoiViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvRectangleRoiViewportToolParser, function(isActivated) {
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
            WVBaseTool.call(this, 'rectangleRoi');
        }
        Controller.prototype = Object.create(WVBaseTool.prototype)
        Controller.prototype.constructor = Controller;
        
        return directive;
    }

})();