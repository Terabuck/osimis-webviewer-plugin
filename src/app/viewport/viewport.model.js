(function(module) {
    'use strict';
    
    /**
     * responsibility: manage cornerstone viewport
     */
    function Viewport(wvImageManager, enabledElement, useLosslessByDefault) {
        this._imageManager = wvImageManager;
        this._enabledElement = enabledElement;

        // Always fetch lossless images if true, fetch resolution adapted to canvas size else
        this._useLosslessByDefault = useLosslessByDefault;

        // Used to throw exception if the same image is drawn multiple times
        this._inProcessingImageId = null;
        
        // Used for instance by tools to retrieve image annotations - or by pixel to mm conversion (used by tools as well)
        this._inProcessingImage = null;

        // Stored to scale the image based on it and to load the most adapted image resolution
        this._canvasWidth = null;
        this._canvasHeight = null;

        // Stored to scale image back when image resolution changes
        this._resolutionScale = null;

        // Kept to free image observers on image change and to resize canvas on window resize
        this._actualImageDisplayer = null;
        
        // Trigger onImageChanging prior to image drawing
        // but after the viewport data is updated
        // Used for instance by tools to set the canvas image annotations prior to the drawing
        this.onImageChanging = new module.Listener();

        // Used for instance by tools on first image shown on viewport to configure cornerstone
        this.onImageChanged = new module.Listener();

        // Used by tools to override the default viewport data
        // For instance, invert-contrast tool switch the default viewportData.invert to true when active
        this.onParametersResetting = new module.Listener();

        // Initialize cornerstone (and canvas)
        cornerstone.enable(this._enabledElement);
    }
    
    // To be injected
    Viewport.$q = null;

    Viewport.prototype.destroy = function() {
        // Kill displayer
        var oldDisplayer = this._actualImageDisplayer;
        if (oldDisplayer) {
            oldDisplayer.destroy();
        }

        // Free listener
        this.onImageChanged.close();

        // @todo cancel loading
        cornerstone.disable(this._enabledElement);
    };

    // used by extensions
    Viewport.prototype.getEnabledElement = function() {
        return this._enabledElement;
    };
    
    // Is used ?
    // Viewport.prototype.getImageId = function() {
    //     return this._inProcessingImageId;
    // };

    // Used by tools to retrieve an image (and its annotations)
    Viewport.prototype.getImage = function() {
        return this._inProcessingImage;
    };

    // Is used ?
    // Viewport.prototype.hasImage = function() {
    //     return this._inProcessingImageId !== null;
    // }

    // allow tools to reacts to click on the viewport
    // @todo move out ?
    Viewport.prototype.enableSelection = function(onSelectedCallback) {
        var _this = this;
        
        if (this._onViewportSelectedCallback) {
            throw new Error("viewport selection already active");
        }

        this._onViewportSelectedCallback = function() {
            onSelectedCallback(_this);
        };
        
        $(this._enabledElement).on('click', this._onViewportSelectedCallback);
    };
    Viewport.prototype.disableSelection = function() {
        $(this._enabledElement).off('click', this._onViewportSelectedCallback);
        this._onViewportSelectedCallback = null;
    };


    // @todo refactor getParameters
    Viewport.prototype.getViewport = function() {
        return cornerstone.getViewport(this._enabledElement);
    };
    // @todo refactor updateParameters & use displayer
    Viewport.prototype.setViewport = function(viewportData) {
        return cornerstone.setViewport(this._enabledElement, viewportData);
    };

    /** Viewport#setImage
     * 
     * @return Promise<Image>
     *
     */
    Viewport.prototype.setImage = function(id, resetParameters) {
        var _this = this;

        resetParameters = resetParameters || false;
        
        // ViewportDisplayPolicy
        // Workflow
        // -- New Image is set
        // 1. Aggregate Root is loaded
        // 2. Image shown with the best available resolution
        // 3. Download desired image if no available image or available resolution < desired one
        // 4. 

        // Throw exception if image already set
        if (id == this._inProcessingImageId && !resetParameters) {
            throw new Error('This image is already shown');
        }
        
        this._inProcessingImageId = id;

        if (resetParameters) {
            this.clearImage();
        }
        
        // Load image model
        return _this._imageManager
            .get(id)
            .then(function(imageModel) {
                // Gather previous image resolution to scale new image parameters
                var oldDisplayer = _this._actualImageDisplayer;
                var previousResolutionScale = oldDisplayer ? oldDisplayer._actualResolutionScale : null;

                // Destroy old image displayer (to remove image observers) & gather its resolution (to convert canvas & paramaters)
                if (oldDisplayer) {
                    oldDisplayer.destroy();
                    _this._actualImageDisplayer = displayer; // make sure the displayer is removed in case of exception
                }

                // Set a new displayer
                var displayer = new module.ImageDisplayer(_this._canvasWidth, _this._canvasHeight, imageModel, previousResolutionScale);

                // Save the displayer to be able destroy it latter
                _this._actualImageDisplayer = displayer;

                // Either select the image quality based on the canvas size or use lossless quality
                if (_this._useLosslessByDefault) {
                    displayer.setLosslessQuality();
                }
                else {
                    displayer.setQualityBasedOnCanvasSize();
                }

                // Either keep old parameters from the previous image or clear them
                if (resetParameters) {
                    displayer.resetParameters();
                }

                // Load & Draw Image
                displayer.draw(_this._enabledElement);
                
                // Trigger onImageChanging
                displayer.onImageLoading.once(function() {
                    var newImage = imageModel;
                    var oldImage = _this._inProcessingImage;
                    _this.onImageChanging.trigger(newImage, oldImage);
                });

                // Trigger onParametersResetting
                displayer.onParametersResetting(function(viewportData) {
                    _this.onParametersResetting.trigger(viewportData);
                });
                
                // Return the result of the drawing
                return Viewport.$q(function(resolve, reject) {
                    displayer.onImageLoaded.once(function() {
                        var newImage = imageModel;
                        var oldImage = _this._inProcessingImage;
                        _this._inProcessingImage = newImage;

                        // Trigger onImageChanged
                        _this.onImageChanged.trigger(newImage, oldImage);

                        // Resolve the promise
                        resolve(imageModel);
                    });
                    displayer.onLoadingCancelled.once(function() {
                        // Reject the promise
                        reject();
                    });
                });
            });
    };
    Viewport.prototype.clearImage = function() {
        this._inProcessingImageId = null;

        $(this._enabledElement).find('canvas').css('visibility', 'hidden');
    
        if (this._actualImageDisplayer) {
            this._actualImageDisplayer.destroy();
        }
        this._actualImageDisplayer = null;
    };
    Viewport.prototype.resizeCanvas = function(width, height) {
        var jqEnabledElement = $(this._enabledElement);

        // Update cached canvas size
        this._canvasWidth = width;
        this._canvasHeight = height;

        // Set the canvas size
        jqEnabledElement.width(width);
        jqEnabledElement.height(height);

        // Set the canvas pixel quantity (? not sure it does that)
        cornerstone.resize(this._enabledElement, false);

        // Recalculate & redraw the image
        if (this._actualImageDisplayer) {
            this._actualImageDisplayer.resizeCanvas(this._enabledElement, this._canvasWidth, this._canvasHeight);
        }
    };

    module.Viewport = Viewport;

})(window.osimis || (window.osimis = {}));
