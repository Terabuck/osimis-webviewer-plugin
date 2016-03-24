(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvZoomViewportTool', wvZoomViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvZoomViewportTool'] = '?^wvZoomViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvZoomViewportTool($parse, WvBaseTool) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvZoomViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvZoomViewportToolParser = $parse(attrs.wvZoomViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvZoomViewportToolParser, function(isActivated) {
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
            WvBaseTool.call(this, 'zoom');
        }
        Controller.prototype = Object.create(WvBaseTool.prototype)
        Controller.prototype.constructor = Controller;
        
        return directive;
    }

})();