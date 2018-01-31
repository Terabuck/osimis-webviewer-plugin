(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSynchroViewportTool', wvSynchroViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvSynchroViewportTool'] = '?^wvSynchroViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvSynchroViewportTool($parse, WvBaseTool) {
        var directive = {
            require: 'wvSynchroViewportTool',
            controller: SynchroCtrl,
            link: link,
            restrict: 'A',
            scope: false
        };

        function link(scope, element, attrs, tool) {
            var wvSyncrhoViewportToolParser = $parse(attrs.wvSynchroViewportTool);
            
            // bind attributes -> tool
            scope.$watch(wvSyncrhoViewportToolParser, function(isActivated) {
                if (isActivated) {
                    tool.activate();
                }
                else {
                    tool.deactivate();
                }
            });
        }

        /* @ngInject */
        function SynchroCtrl() {
            WvBaseTool.call(this, 'Synchronizer');

            // BaseTool class as been made for annotation. This is not one.
            // We overide this method so the glass is not shown once toggled
            // off. When we deactivate an annotation, we let the annotation
            // shown, but only deactivate the inputs.
            // For tools related to cornerstone (@todo split BaseTool in AnnotationTools & others)
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
            this.register = function(viewport) {
                this.viewports.push(viewport)

                if (this.isActivated) {
                    this.activate(viewport);
                }
            };
            this.unregister = function(viewport) {
                if (cornerstoneTools[this.toolName]) {
                    // Set tool in disable mode (it's a 1D state machine with 4
                    // states) - don't display annotations & ignore inputs.
                    // 1. Retrieve DOM element
                    var enabledElement = viewport.getEnabledElement();
                    // 2. Ignore exception if no image is shown in the viewport
                    var isElementEnabled = undefined;
                    try {
                        isElementEnabled = true;
                        cornerstone.getEnabledElement(enabledElement); 
                    }
                    catch (exc) {
                        isElementEnabled = false;
                    }
                    // 3. Change tool state
                    // if (isElementEnabled) {
                    //     cornerstoneTools[this.toolName].enable(enabledElement, 1);
                    //     if (this.toolName2) {
                    //         cornerstoneTools[this.toolName2].activate(enabledElement);
                    //     }
                    // }
                }

                this._unlistenModelChange(viewport);
                
                _.pull(this.viewports, viewport);
            };
            this.activate = function() {
            	console.log("in activate");
            }
            this.deactivate = function() {
            	console.log("in deactivate");
            }
        }
        SynchroCtrl.prototype = Object.create(WvBaseTool.prototype)
        SynchroCtrl.prototype.constructor = SynchroCtrl;
        
        return directive;
    }

})();