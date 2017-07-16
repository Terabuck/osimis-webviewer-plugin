(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvMagnifyingGlassViewportTool', wvMagnifyingGlassViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvMagnifyingGlassViewportTool'] = '?^wvMagnifyingGlassViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvMagnifyingGlassViewportTool($parse, WvBaseTool) {
        var directive = {
            require: 'wvMagnifyingGlassViewportTool',
            controller: MagnifyingGlassCtrl,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvMagnifyingGlassViewportToolParser = $parse(attrs.wvMagnifyingGlassViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvMagnifyingGlassViewportToolParser, function(newConfig, oldConfig) {
                // Set magnifying glass configuration.
                var csConfig = {
                    // Canvas' width/height in pixel.
                    magnifySize: newConfig.magnifyingGlassSize,
                    // Zoom depth.
                    magnificationLevel: newConfig.magnificationLevel
                };

                cornerstoneTools.magnify.setConfiguration(csConfig);

                // The `cornerstoneTools.magnify.setConfiguration` method
                // doesn't update the configuration. We have to manualy disable
                // the magnify tool to reset it.
                if (oldConfig.enabled) {
                    tool.deactivate();
                }

                // Activate back the magnifying too keep it disabled.
                if (newConfig.enabled) {
                    tool.activate();
                }
                // else {
                //     tool.deactivate();
                // }

                setTimeout(function() {
                    // Ensure the magnifying glass always stay on top of
                    // everything.
                    var magnifyingGlassCanvasEl = $('.magnifyTool')[0];
                    magnifyingGlassCanvasEl.style.zIndex = "1000000";

                    // The `cornerstoneTools.magnify.setConfiguration` method
                    // doesn't update the glass size. We have to manually change
                    // the magnifying glass size.
                    if (oldConfig.magnifyingGlassSize !== newConfig.magnifyingGlassSize) {
                        magnifyingGlassCanvasEl.width = csConfig.magnifySize;
                        magnifyingGlassCanvasEl.height = csConfig.magnifySize;
                    }
                });
            }, true);
        }

        /* @ngInject */
        function MagnifyingGlassCtrl() {
            WvBaseTool.call(this, 'magnify', 'magnifyTouchDrag');

        }
        MagnifyingGlassCtrl.prototype = Object.create(WvBaseTool.prototype)
        MagnifyingGlassCtrl.prototype.constructor = MagnifyingGlassCtrl;
        
        return directive;
    }

})();