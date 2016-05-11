(function(module) {
    'use strict';
    
    function ImageDisplayer(canvasWidth, canvasHeight, imageModel, previousResolutionScale) {
        // Used to chose quality and fit image in canvas - cached because dom access may create reflow (bad when resizing window)
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;
        this._image = imageModel;

        this._desiredQuality = null;
        this._actualQuality = null;

        this._resetParameters = false;
        this._isImageLoaded = false;

        // Cancel drawing when the image is no longer displayed
        this._isDestroyed = false;
        
        // Used when previous image was resampled - scale and translation where corrupted
        // In order for this to work, only one image can be shown at a time !
        this._actualResolutionScale = previousResolutionScale || null;
    
        // Used by the viewport to return the setImage promise
        this.onImageLoaded = new module.Listener();
        this.onLoadingCancelled = new module.Listener();
        
        // Used by the viewport to allow tools to change the image prior to redrawing
        this.onImageLoading = new module.Listener();
    }
    
    ImageDisplayer.prototype.destroy = function() {
        this._isDestroyed = true;
        
        this.onImageLoading.close();

        this.onLoadingCancelled.close();
        this.onImageLoaded.close();

        // @todo Free listeners
    };

    ImageDisplayer.prototype.resetParameters = function() {
        this._resetParameters = true;
    };

    ImageDisplayer.prototype.setQualityBasedOnCanvasSize = function() {
        var availableQualities = this._image.getAvailableQualities();

        // chose quality depending of viewport size
        var quality = null;
        if (this._canvasWidth <= 150 || this._canvasHeight <= 150) {
            quality = availableQualities.R150J100;
        }
        else if (this._canvasWidth <= 1000 || this._canvasHeight <= 1000) {
            quality = availableQualities.R1000J100;
        }
        else {
            quality = availableQualities.J100;
        }

        this._desiredQuality = quality;
    };

    // Load desired image resolution and intermediates if required
    ImageDisplayer.prototype._loadImageBinaries = function(onBinaryLoadedCallback) {
        var _this = this;
        var image = this._image;

        var availableQualities = image.getAvailableQualities();

        // Set the lowest quality we want to draw
        var minimumQuality = image.getBestQualityInCache() || 0;

        // Override desired quality to a better one if already in cache
        var maximumQuality = this._desiredQuality > minimumQuality ? this._desiredQuality : minimumQuality;

        // Start loading binaries from the highest cached quality to the desired quality
        for (var prop in availableQualities) {
            var quality = availableQualities[prop];
            if (quality >= minimumQuality && quality <= maximumQuality) {
                // Load the binary
                var promise = image.loadBinary(quality);

                // Use a closure to scope the quality inside the loop (instead of outside)
                (function(quality) {
                    // On loaded, call the callback
                    promise.then(function(cornerstoneImageObject) {
                        // @todo cancel intermediate request if somehow better quality is downloaded

                        onBinaryLoadedCallback(quality, cornerstoneImageObject);
                        // @todo manage errors
                    });
                })(quality);
            }
        }
    };
    ImageDisplayer.prototype.resizeCanvas = function(enabledElement, width, height) {
        // save the viewport canvas size for ulterior uses (eg. know if an image is larger than its viewport)
        this._canvasWidth = width;
        this._canvasHeight = height;

        // fit the image back in the viewport & draw it
        var cornerstoneImageObject = cornerstone.getImage(enabledElement);
        var viewportData = cornerstone.getViewport(enabledElement);
        if (cornerstoneImageObject && viewportData) {
            // Get cleaned parameters
            // @todo only clean width/height
            var viewportData = this._getCornerstoneViewport(enabledElement, cornerstoneImageObject, true);

            // Redraw the image
            cornerstone.displayImage(enabledElement, cornerstoneImageObject, viewportData);
        }
    };

    /** ImageDisplayer#_getCornerstoneViewport
     *
     * Get cornerstone viewport data, and fix adapt them to the image resolution
     *
     */
    ImageDisplayer.prototype._getCornerstoneViewport = function(enabledElement, cornerstoneImageObject, resetParameters) {
        var viewportData = null;

        // Force resetParameters if canvas is still empty
        if (!cornerstone.getViewport(enabledElement)) {
            resetParameters = true;
        }

        if (resetParameters) {
            // Clean Parameters - First Image Load - Or explicit image resetting (on window resize)
            // resetParameters viewport define an image scale adapted to the viewport size

            // get the base viewport data
            viewportData = cornerstone.getDefaultViewportForImage(enabledElement, cornerstoneImageObject);

            // rescale the image to fit it into viewport
            var newResolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

            var isImageSmallerThanViewport = cornerstoneImageObject.originalWidth <= this._canvasWidth && cornerstoneImageObject.originalHeight <= this._canvasHeight;
            if (isImageSmallerThanViewport) {
                // show the image unscalled
                viewportData.scale = 1.0 * newResolutionScale;
            }
            else {
                // downscale the image to fit the viewport

                // choose the smallest between vertical and horizontal scale to show the entire image (and not upscale one of the two)
                var verticalScale = this._canvasHeight / cornerstoneImageObject.originalHeight * newResolutionScale;
                var horizontalScale = this._canvasWidth / cornerstoneImageObject.originalWidth * newResolutionScale;
                if(horizontalScale < verticalScale) {
                  viewportData.scale = horizontalScale;
                }
                else {
                  viewportData.scale = verticalScale;
                }
            }
            
            // also, resetParameters the image position
            viewportData.translation.x = 0;
            viewportData.translation.y = 0;

            // save the resolutionScale for further uses (eg. image resolution change)
            this._actualResolutionScale = newResolutionScale;

            // allow extensions to extend this behavior
            // @todo this.onViewportResetting.trigger(viewportData);
        }
        else if (!resetParameters && !this._isImageLoaded) {
            // Dirty Parameters - First Image Load

            // get the current viewport data
            viewportData = cornerstone.getViewport(enabledElement);

            // we want to adapt to the new resolution of the image
            // on resetParameters, we do not want to adapt to the image resolution 
            // because it could scale the image larger than the viewport size for instance

            // rescale the image to its (possible) new resolution
            var oldResolutionScale = this._actualResolutionScale || 1;
            var newResolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

            // scale viewportData.scale from oldResolutionScale to newResolutionScale
            var oldScale = viewportData.scale;
            var newScale = oldScale / oldResolutionScale * newResolutionScale;
            viewportData.scale = newScale;
            
            // Compensate the translation rescaling induced by image resolution change (zoom is applied to the translation).
            var deltaScale = newScale / oldScale;
            viewportData.translation.x = viewportData.translation.x / deltaScale;
            viewportData.translation.y = viewportData.translation.y / deltaScale;

            // save the resolutionScale further uses (eg. when image resolution change)
            this._actualResolutionScale = newResolutionScale;
        }
        else if (!resetParameters && this._isImageLoaded) {
            // Dirty Parameters - Resolution Change

            // get the current viewport data
            viewportData = cornerstone.getViewport(enabledElement);

            // we want to adapt to the new resolution of the image
            // on resetParameters, we do not want to adapt to the image resolution 
            // because it could scale the image larger than the viewport size for instance

            // rescale the image to its (possible) new resolution
            var oldResolutionScale = this._actualResolutionScale || 1;
            var newResolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

            // scale viewportData.scale from oldResolutionScale to newResolutionScale
            var oldScale = viewportData.scale;
            var newScale = oldScale / oldResolutionScale * newResolutionScale;
            viewportData.scale = newScale;
            
            // Compensate the translation rescaling induced by image resolution change (zoom is applied to the translation).
            var deltaScale = newScale / oldScale;
            viewportData.translation.x = viewportData.translation.x / deltaScale;
            viewportData.translation.y = viewportData.translation.y / deltaScale;

            // save the resolutionScale further uses (eg. when image resolution change)
            this._actualResolutionScale = newResolutionScale;
        }
        else {
            throw new Error('incoherent state');
        }

        return viewportData;
    };

    /** ImageDisplayer#draw(enabledElement)
     *
     * @return Promise<Image> resolved when the first image drawing occurs
     *
     */
    ImageDisplayer.prototype.draw = function(enabledElement) {
        var _this = this;

        // Load intermediate & desired binaries
        this._loadImageBinaries(_onBinaryLoaded);

        // Draw binaries when loaded
        function _onBinaryLoaded(quality, cornerstoneImageObject) {
            // Cancel drawing if the image is no longer displayed & trigger event used by Viewport#setImage to return promise
            if (_this._isDestroyed) {
                _this.onLoadingCancelled.trigger();
                return;
            }

            var formerQuality = _this._actualQuality || 0;
            var newQuality = quality;

            // Do not draw the new binary if its quality is lower than the former one
            if (newQuality <= formerQuality) {
                return;
            }

            // Draw the binary
            {
                // Gatter the viewport datas
                var viewportData = _this._getCornerstoneViewport(enabledElement, cornerstoneImageObject, _this._resetParameters);

                // Disable resetParameters for resolution changes
                _this._resetParameters = false;

                // Trigger onImageLoading prior to image drawing
                // but after the viewport data is updated
                // Used to avoid multiple useless consecutive redrawing with tool
                // Particulary when a new image is drawn and the tool has to apply to each image
                _this.onImageLoading.trigger();
                
                // Display image
                //   force redraw because image binary changes, even if param do not (resetParameters the canvas size)
                //   cornerstone#displayImage can not be used because it doesn't allow to invalidate cornerstone cache
                var enabledElementObject = cornerstone.getEnabledElement(enabledElement); // enabledElementObject != enabledElementDom
                enabledElementObject.image = cornerstoneImageObject;
                enabledElementObject.viewport = viewportData;
                cornerstone.updateImage(enabledElement, true); // draw image & invalidate cornerstone cache
                
                // unhide viewport
                $(enabledElement).find('canvas').css('visibility', 'visible');
            }

            // Update the actual quality
            _this._actualQuality = newQuality;
            
            // Define the image as loaded to differentiate first binary loading from image resolution change
            if (!_this._isImageLoaded) {
                _this._isImageLoaded = true;
            }

            // Trigger event used by Viewport#setImage to return promise
            _this.onImageLoaded.trigger(newQuality);
        };
    };

    module.ImageDisplayer = ImageDisplayer;

})(window.osimis || (window.osimis = {}));