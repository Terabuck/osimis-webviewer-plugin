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
                if (oldConfig.enabled || !newConfig.enabled) {
                    tool.deactivate();
                }

                // Activate back the magnifying.
                var magnifyingGlassCanvasEl = $('.magnifyTool')[0];
                if (newConfig.enabled) {
                    tool.activate();
                    (function() {
                        // Ensure the magnifying glass always stay on top of
                        // everything.
                        magnifyingGlassCanvasEl.style.zIndex = "1000000";

                        // The `cornerstoneTools.magnify.setConfiguration` method
                        // doesn't update the glass size. We have to manually change
                        // the magnifying glass size.
                        if (oldConfig.magnifyingGlassSize !== newConfig.magnifyingGlassSize) {
                            magnifyingGlassCanvasEl.width = csConfig.magnifySize;
                            magnifyingGlassCanvasEl.height = csConfig.magnifySize;
                        }
                    });
                }
                else {
                }
            }, true);
        }

        /* @ngInject */
        function MagnifyingGlassCtrl() {
            WvBaseTool.call(this, 'magnify', 'magnifyTouchDrag');

            this._deactivateInputs = function(viewport) {
                // Unlisten to events
                var enabledElement = viewport.getEnabledElement();
                cornerstoneTools.mouseInput.disable(enabledElement);
                cornerstoneTools.touchInput.disable(enabledElement);

                // Set tool in disable mode.
                cornerstoneTools[this.toolName].disable(enabledElement, 1);
                if (this.toolName2) {
                    cornerstoneTools[this.toolName2].disable(enabledElement);
                }
            };

        }
        MagnifyingGlassCtrl.prototype = Object.create(WvBaseTool.prototype)
        MagnifyingGlassCtrl.prototype.constructor = MagnifyingGlassCtrl;
        
        return directive;
    }

})();