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
    function wvAngleMeasureViewportTool($parse, WVBaseTool) {
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

        function link(scope, element, attrs, tool) {
            var wvAngleMeasureViewportToolParser = $parse(attrs.wvAngleMeasureViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvAngleMeasureViewportToolParser, function(isActivated) {
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
            WVBaseTool.call(this, 'angle');
        }
        Controller.prototype = Object.create(WVBaseTool.prototype)
        Controller.prototype.constructor = Controller;
    
        return directive;
    }

})();