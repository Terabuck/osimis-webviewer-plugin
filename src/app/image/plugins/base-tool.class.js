(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVBaseTool', factory);

    /* @ngInject */
    function factory($rootScope, $timeout, $, _, cornerstoneTools, debounce) {
        
    function BaseTool(toolName) {
        this.viewports = [];

        this.toolName = toolName;
        this.isActivated = false;
    }

    BaseTool.prototype.register = function(viewport) {
        var _this = this;
        
            this.viewports.push(viewport)

            this._listenModelChange(viewport);

            if (this.isActivated) {
                this.activate(viewport);
            }
    }

        BaseTool.prototype.unregister = function(viewport) {
            this._unlistenModelChange(viewport);
            
            _.pull(this.viewports, viewport);
        };

        BaseTool.prototype._activateInputs = function(viewport) {
            var enabledElement = viewport.getEnabledElement();

            cornerstoneTools.mouseInput.enable(enabledElement);
            cornerstoneTools[this.toolName].activate(enabledElement, true);
        };
        BaseTool.prototype._deactivateInputs = function(viewport) {
            var enabledElement = viewport.getEnabledElement();

            cornerstoneTools[this.toolName].deactivate(enabledElement);
            cornerstoneTools.mouseInput.disable(enabledElement);
        };
        var _imageByViewportListenerIds = [];
        BaseTool.prototype._listenModelChange = function(viewport) {
            var _this = this;

            var toolName = this.toolName;
            var enabledElement = viewport.getEnabledElement();
            var toolStateManager = cornerstoneTools.getElementToolStateManager(enabledElement);
            
            var currentImage = viewport.getImage();

            // load tool data in cornerstone elements
            var annotation = currentImage.getAnnotations(_this.toolName);
            if (annotation) {
                toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data);
            }

            // listen to the new image model changes
            currentImage.onAnnotationChanged([_this, viewport], function(annotation) {
                if (annotation.type !== _this.toolName) return;
                toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data);
            });

            viewport.onImageChanged(this, function(newImage, oldImage) {
                // close old image listeners
                if (oldImage) {
                    oldImage.onAnnotationChanged.close([_this, viewport]);
                }

                // load tool data in cornerstone elements
                var annotation = newImage.getAnnotations(_this.toolName);
                if (annotation) {
                    toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data);
                }
                
                // listen to the new image model changes
                newImage.onAnnotationChanged([_this, viewport], function(annotation) {
                    if (annotation.type !== _this.toolName) return;
                    toolStateManager.restoreStateByToolAndImageId(annotation.type, annotation.imageId, annotation.data);
                });
            });
        };
        BaseTool.prototype._unlistenModelChange = function(viewport) {
            var image = viewport.getImage();
            if (image) {
                image.onAnnotationChanged.close([this, viewport]);
            }

            viewport.onImageChanged.close(this);
        };
        BaseTool.prototype._listenViewChange = function(viewport) {
            var _this = this;
            var enabledElement = viewport.getEnabledElement();
            var toolStateManager = cornerstoneTools.getElementToolStateManager(enabledElement);

            $(enabledElement).on('CornerstoneImageRendered.'+this.toolName, _.debounce(function() {
                $timeout(function() {
                    // avoid having to use angular deep $watch
                    // using a fast shallow object clone
                    var image = viewport.getImage();
                    var data = _.clone(toolStateManager.getStateByToolAndImageId(_this.toolName, image.id));
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
        this.viewports.forEach(this.activate.bind(this))
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
