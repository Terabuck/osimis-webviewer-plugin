(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WvBaseTool', factory);

    /* @ngInject */
    function factory($rootScope, $, _, cornerstoneTools, debounce) {
        
        /** BaseTool
          *
          * Base class for cornerstoneTools implementation
          *
          */
        function BaseTool(toolName) {
            this.viewports = [];

            this.toolName = toolName;
            this.isActivated = false;
        }

        // method called by the viewport
        BaseTool.prototype.register = function(viewport) {
            var _this = this;
            
            this.viewports.push(viewport)
        
            // For tools related to cornerstone (@todo split BaseTool in AnnotationTools & others)
            if (cornerstoneTools[this.toolName]) {
                // Set tool in enable mode (it's a 1D state machine with 4
                // states) - display annotations but ignore inputs.
                var enabledElement = viewport.getEnabledElement();
                cornerstoneTools[this.toolName].enable(enabledElement, 1);
            }

            this._listenModelChange(viewport);

            if (this.isActivated) {
                this.activate(viewport);
            }
        }

        // method called by the viewport
        BaseTool.prototype.unregister = function(viewport) {
            // For tools related to cornerstone (@todo split BaseTool in AnnotationTools & others)
            if (cornerstoneTools[this.toolName]) {
                // Set tool in disable mode (it's a 1D state machine with 4
                // states) - don't display annotations & ignore inputs.
                var enabledElement = viewport.getEnabledElement();
                cornerstoneTools[this.toolName].enable(enabledElement, 1);
            }

            this._unlistenModelChange(viewport);
            
            _.pull(this.viewports, viewport);
        };

        BaseTool.prototype._activateInputs = function(viewport) {
            // Listen to events
            var enabledElement = viewport.getEnabledElement();
            cornerstoneTools.mouseInput.enable(enabledElement);
            cornerstoneTools.touchInput.enable(enabledElement);

            // Set tool in activate mode (it's a 1D state machine with 4
            // states) - display annotations and listen to inputs.
            cornerstoneTools[this.toolName].activate(enabledElement, 1);
        };
        BaseTool.prototype._deactivateInputs = function(viewport) {
            // Unlisten to events
            var enabledElement = viewport.getEnabledElement();
            cornerstoneTools.mouseInput.disable(enabledElement);
            cornerstoneTools.touchInput.disable(enabledElement);

            // Set tool in enable mode (it's a 1D state machine with 4
            // states) - display annotations but ignore inputs.
            cornerstoneTools[this.toolName].enable(enabledElement, 1);
        };

        var _imageByViewportListenerIds = [];
        // listen viewport annotation change or viewport image change
        BaseTool.prototype._listenModelChange = function(viewport) {
            var _this = this;

            var toolName = this.toolName;
            var enabledElement = viewport.getEnabledElement();
            var toolStateManager = cornerstoneTools.getElementToolStateManager(enabledElement);
            
            var currentImage = viewport.getImage();

            // load tool data in cornerstone elements
            var annotation = currentImage.getAnnotations(_this.toolName);
            if (annotation) {
                toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data, false);//false?
            }

            // listen to the new image model changes
            currentImage.onAnnotationChanged([_this, viewport], function(annotation) {
                // Filter out annotations that are not concerned by this tool
                if (annotation.type !== _this.toolName) return;

                // Restore annotations in cornerstone
                toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data, true);
            });
            
            // onImageChanging is used instead of onImageChanged to avoid useless repaint
            // as the toolStateManager.restoreStateByToolAndImageId does redraw the image
            viewport.onImageChanging(this, function(newImage, oldImage) {
                // close old image listeners
                if (oldImage) {
                    oldImage.onAnnotationChanged.close([_this, viewport]);
                }

                // load tool data in cornerstone elements
                var annotation = newImage.getAnnotations(_this.toolName);
                if (annotation) {
                    toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data, false);
                }
                
                // listen to the new image model changes
                newImage.onAnnotationChanged([_this, viewport], function(annotation) {
                    // Filter out annotations that are not concerned by this tool
                    if (annotation.type !== _this.toolName) return;

                    // Restore annotations in cornerstone
                    toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data, true);
                });
            });
        };
        BaseTool.prototype._unlistenModelChange = function(viewport) {
            var image = viewport.getImage();
            if (image) {
                image.onAnnotationChanged.close([this, viewport]);
            }

            viewport.onImageChanging.close(this);
        };
        BaseTool.prototype._listenViewChange = function(viewport) {
            var _this = this;
            var enabledElement = viewport.getEnabledElement();
            var toolStateManager = cornerstoneTools.getElementToolStateManager(enabledElement);

            // for each viewport, listen..
            // @todo debounce should be throttle when liveshare is "on"
            // 
            $(enabledElement).on('CornerstoneImageRendered.'+this.toolName, _.debounce(function() {
                var image = viewport.getImage();
                var newAnnotationsData = toolStateManager.getStateByToolAndImageId(_this.toolName, image.id);
                var oldAnnotations = image.getAnnotations(_this.toolName);
                
                // As update checks are made on each CornerstoneImageRendered
                // don't trigger update if the newAnnotations hasn't changed
                // this would be way too slow otherwise
                // The handles visibility is compared as well (highlight & active properties) - for livesharing purpose
                if (oldAnnotations && _.isEqual(newAnnotationsData, oldAnnotations.data)) return;
                
                // do the $evalAsync after the check to avoid a potential useless $digest cycle in case there is no change
                $rootScope.$evalAsync(function() {
                    // avoid having to use angular deep $watch
                    // using a fast shallow object clone
                    var data = _.clone(newAnnotationsData);

                    // Ignore the BaseTool onAnnotationChanged listening to avoid dual annotation draw (the 
                    // annotations are already drawed). The onAnnotationChanged will still be listened by other observers.
                    image.onAnnotationChanged.ignore([_this, viewport], function() {
                        if (data && data.data.length) {
                            image.setAnnotations(_this.toolName, data);
                        }
                        else if (data && !data.data.length) {
                            // remove empty annotation
                            image.setAnnotations(_this.toolName, null);
                        }
                    });
                });
            }, 20));
        };

        BaseTool.prototype._unlistenViewChange = function(viewport) {
            var enabledElement = viewport.getEnabledElement();

            $(enabledElement).off('CornerstoneImageRendered.'+this.toolName);
        };

        BaseTool.prototype._process = function(viewport) {};
        BaseTool.prototype._unprocess = function(viewport) {};

        /** BaseTool#activate([viewport])
         * 
         */
        BaseTool.prototype.activate = function(viewport) {
            if (typeof viewport === 'undefined') {
                // apply to every viewports
                this.viewports.forEach(this.activate.bind(this));
                this.isActivated = true;
            }
            else {
                var enabledElement = viewport.getEnabledElement();
                
                this._process(viewport);
                this._activateInputs(viewport);
                this._listenViewChange(viewport);
            }
        };
        BaseTool.prototype.deactivate = function(viewport) {
            var _this = this;
            this.viewports.forEach(function (viewport) {
                _this._unlistenViewChange(viewport);
                _this._deactivateInputs(viewport);
                _this._unprocess(viewport);
            });

            this.isActivated = false;
        };

        return BaseTool;
    }
    
})();
