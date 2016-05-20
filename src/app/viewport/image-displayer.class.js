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

        // Used to cancel binaries loading on destroy
        this._binariesInLoading = []; // [<quality1>, <quality2>, ...]

        // Cancel drawing when the image is no longer displayed
        this._isDestroyed = false;

        // Store the last loaded image quality to free memory latter.
        // Note _lastLoadedImageQuality !== _actualQuality has the last loaded image may not
        // be the last shown image (for instance if the last loaded image has lower quality than the last
        // shown image)
        this._lastLoadedImageQuality = null;
        
        // Used when previous image was resampled - scale and translation where corrupted
        // In order for this to work, only one image can be shown at a time !
        this._actualResolutionScale = previousResolutionScale || null;
    
        // Used by the viewport to return the setImage promise
        this.onImageLoaded = new module.Listener();
        this.onLoadingCancelled = new module.Listener();

        // Used by tools to override the default viewport data
        // For instance, invert-contrast tool switch the default viewportData.invert to true when active
        this.onParametersResetting = new module.Listener();
        
        // Used by the viewport to allow tools to change the image prior to redrawing
        this.onImageLoading = new module.Listener();
    }
    
    ImageDisplayer.prototype.destroy = function() {
        var _this = this;

        this._isDestroyed = true;

        // Cancel binary loading requests
        this._binariesInLoading.forEach(function(quality) {
            try {
                _this._image.abortBinaryLoading(quality);
            }
            catch(exc) {
                // Ignore exceptions: they may be caused because
                // we try to free a binary whose download has been
                // successfuly cancelled by the repository but not
                // yet been removed from _binariesInLoading.
                // @todo check this theory w/ chrome timeline
                // @todo unit test
            }
        });

        // Free image binary
        if (this._lastLoadedImageQuality) {
            this._image.freeBinary(this._lastLoadedImageQuality);
        }
        
        // Free events
        this.onImageLoading.close();
        this.onLoadingCancelled.close();
        this.onImageLoaded.close();
        this.onParametersResetting.close();

        // Free listeners
        this._image.onAnnotationChanged.close(_this);
    };

    ImageDisplayer.prototype.resetParameters = function() {
        this._resetParameters = true;
    };

    /** ImageDisplayer#setLosslessQuality
     *
     * Always fetch lossless quality.
     * Note the displayer will still show intermediate quality levels before showing the lossless
     *
     */
    ImageDisplayer.prototype.setLosslessQuality = function() {
        var availableQualities = this._image.getAvailableQualities();
        this._desiredQuality = availableQualities.LOSSLESS;
    };

    /** ImageDisplayer#setLosslessQuality
     *
     * Select fetched quality base on canvas size.
     * Useful for thumbnail-like viewports.
     *
     */
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
            quality = availableQualities.LOSSLESS;
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
                        // The binary has loaded
                        // Remove the binary from the binariesInLoading queue (used to be able to cancel the loading request)
                        _.pull(_this._binariesInLoading, quality);

                        // Call the "binary has loaded" callback
                        onBinaryLoadedCallback(quality, cornerstoneImageObject);

                        // @todo cancel intermediate request if somehow better quality is already downloaded
                        // @todo manage errors
                    }, function(err) {
                        // Remove the binary from the binariesInLoading queue (used to be able to cancel the loading request)
                        _.pull(_this._binariesInLoading, quality);
                        
                        // Call loading cancelled callback
                        _this.onLoadingCancelled.trigger(err);
                    });
                })(quality);

                // Save the loaded quality to be able to cancel the loading request if the displayer is destroyed
                _this._binariesInLoading.push(quality);
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
            this._resetCornerstoneViewportData(enabledElement, cornerstoneImageObject); // @todo only clean width/height - not windowing

            // Redraw the image - don't use cornerstone#displayImage because bugs occurs (only when debugger is off)
            // those issues may come from changing the cornerstoneImageObject (cornerstone probably cache it)
            var viewportData = cornerstone.getViewport(enabledElement);
            var enabledElementObject = cornerstone.getEnabledElement(enabledElement); // enabledElementObject != enabledElementDom
            enabledElementObject.viewport = viewportData;
            enabledElementObject.image = cornerstoneImageObject;
            cornerstone.updateImage(enabledElement, true); // draw image & invalidate cornerstone cache (multiple viewport with different resolution can be displayed at the same time)
            $(enabledElementObject.element).trigger("CornerstoneImageRendered", {
                viewport: enabledElementObject.viewport,
                element : enabledElementObject.element,
                image : enabledElementObject.image,
                enabledElement : enabledElementObject,
                canvasContext: enabledElementObject.canvas.getContext('2d')
            });
        }
    };

    /** ImageDisplayer#_resetCornerstoneViewportData()
     *
     * Reset the cornerstone viewport data.
     * Fit the image in the canvas.
     *
     */
    ImageDisplayer.prototype._resetCornerstoneViewportData = function(enabledElement, cornerstoneImageObject) {
        // get the base viewport data
        var viewportData = cornerstone.getDefaultViewportForImage(enabledElement, cornerstoneImageObject);

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

        // Save changes in cornerstone (without redrawing)
        var enabledElementObject = cornerstone.getEnabledElement(enabledElement); // enabledElementObject != enabledElementDom
        enabledElementObject.viewport = viewportData;

        // allow extensions to extend this behavior
        // Used by invert tool to redefine inversion on viewport reset
        this.onParametersResetting.trigger(viewportData);
    };

    /** ImageDisplayer#_adaptAnnotationsResolution()
     *
     * Convert the annotations (scale & translation) to the new resolution.
     * Dirty fix, cornerstoneTools should use mm instead of px.
     *
     */
    ImageDisplayer.prototype._adaptAnnotationsResolution = function(enabledElement, cornerstoneImageObject) {
        // Retrieve annotations as they were saved
        var image = this._image;
        var annotations = image.getAnnotations();

        // Retrieve the resolution change
        var resolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

        // List which properties should be converted by annotation type
        var propertyConversionTable = {
            length: [
                'handles.start.x',
                'handles.start.y',
                'handles.end.x',
                'handles.end.y',
            ],
            rectangleRoi: [
                'handles.start.x',
                'handles.start.y',
                'handles.end.x',
                'handles.end.y',
            ],
            ellipticalRoi: [
                'handles.start.x',
                'handles.start.y',
                'handles.end.x',
                'handles.end.y',
            ],
            angle: [
                'handles.start.x',
                'handles.start.y',
                'handles.start2.x',
                'handles.start2.y',
                'handles.end.x',
                'handles.end.y',
                'handles.end2.x',
                'handles.end2.y',
            ],
            probe: [
                'handles.end.x',
                'handles.end.y',
            ]
        };

        // Convert annotation pixel positions to the new resolution
        annotations.forEach(function(annotationGroup) {
            // Convert the handle positions for the annotations using two handles.
            if (propertyConversionTable.hasOwnProperty(annotationGroup.type)) {
                // Convert pixel position of each annotation to the new image resolution
                var originalScale = annotationGroup.data.scale || 1;
                var scaleDelta = originalScale / resolutionScale;

                // @todo @warning Save the original scale in annotationGroup.data when it is first created
                // to ensure its saving through user sessions

                var annotationsData = annotationGroup.data.data;
                var propertiesToConvert = propertyConversionTable[annotationGroup.type];
                
                // Convert each annotations' data
                annotationsData.forEach(function(data) {
                    // Retrieve an array with all the values to convert, convert them all
                    _
                        .at(data, propertiesToConvert)
                        .forEach(function(value, index) {
                            // Retrieve the converted property name
                            var convertedProperty = propertiesToConvert[index];

                            // Convert the value
                            var convertedValue = value * scaleDelta;

                            // Replace the converted property's value
                            _.set(data, convertedProperty, convertedValue);
                        });
                });

                // Save the rescaling of the annotation for further processing
                annotationGroup.data.scale = resolutionScale;

                // Save back annotations
                image.setAnnotations(annotationGroup.type, annotationGroup.data);
            }
        });

        
    };
    /** ImageDisplayer#_adaptImageResolution()
     *
     * Convert the cornerstone viewport data (scale & translation) to the new resolution.
     * Convert the annotations (scale & translation) to the new resolution. (* dirty fix, cornerstoneTools should use mm instead of px)
     *
     */
    ImageDisplayer.prototype._adaptImageResolution = function(enabledElement, cornerstoneImageObject) {
        /* Convert cornerstone viewport data */

        // get the current viewport data
        var viewportData = cornerstone.getViewport(enabledElement);

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

        // Save changes in cornerstone (without redrawing)
        var enabledElementObject = cornerstone.getEnabledElement(enabledElement); // enabledElementObject != enabledElementDom
        enabledElementObject.viewport = viewportData;
    };

    /** ImageDisplayer#draw(enabledElement)
     *
     * Draw an image into the viewport using cornerstone.
     * This handle dynamic resolution change of image.
     * To achieve this, cornerstone viewport scale and translation are rescaled at each resolution change,
     * as well as the tools data (wich are stored in pixels, not mm).
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
                // Trigger loading canceled (so the setImage caller can reject its promise)
                _this.onLoadingCancelled.trigger();

                // Note the image is already freed by the #destroy() method
                
                return;
            }

            var formerQuality = _this._actualQuality || 0;
            var newQuality = quality;

            // Do not draw the new binary if its quality is lower than the former one
            if (newQuality <= formerQuality) {
                // Free new quality we won't use anyway...
                _this._image.freeBinary(newQuality);
                return;
            }

            // Free the former loaded binary
            // do not use formerQuality because _actualQuality is not updated if the new loaded quality
            // is lower than the previous one
            if (_this._lastLoadedImageQuality !== null) {
                _this._image.freeBinary(_this._lastLoadedImageQuality);
            }
            _this._lastLoadedImageQuality = quality;

            {
                /** Draw the binary
                 * Use Cases:
                 *   (1. Window Resize -> Reset Canvas : reset scale & translation) on ImageDisplayer#resizeCanvas call - not when onBinaryLoaded
                 *   2. Serie change or manual reset -> Reset Parameters : reset scale, translation & everything else (windowing, ...)
                 *   3. Image change -> Convert Parameters to new Image Resolution
                 *   4. Resolution change -> Convert Parameters to new Image Resolution
                 */

                // Force canvas reset if it is still empty
                var viewportData = cornerstone.getViewport(enabledElement);
                if (!viewportData) {
                    _this._resetParameters = true;
                }

                // Tag each new annotations with the actual image resolution
                // so the annotations can be scaled to the right amount when 
                // resolution change (the annotations are positionned in pixels)
                // - unregister the previous annotation listener
                if (_this._isImageLoaded) {
                    _this._image.onAnnotationChanged.close(_this);
                }
                // - register the new annotation listener
                _this._image.onAnnotationChanged(_this, function(annotation) {
                    // For every new untagged annotation
                    if (annotation && annotation.data && typeof annotation.data.scale === 'undefined') {
                        // Tag the annotation with the image resolution
                        annotation.data.scale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;
                    }
                });

                // Either clear viewport or convert cornerstone datas to the actual resolution
                if (!_this._isImageLoaded && _this._resetParameters) {
                    // First image displaying - Reset parameters
                    _this._resetCornerstoneViewportData(enabledElement, cornerstoneImageObject);
                    _this._adaptAnnotationsResolution(enabledElement, cornerstoneImageObject);

                    // Disable resetParameters for resolution changes
                    _this._resetParameters = false;
                }
                else if (_this._isImageLoaded && !_this._resetParameters) {
                    // First image displaying - adapt resolution from previous image
                    _this._adaptImageResolution(enabledElement, cornerstoneImageObject);
                    _this._adaptAnnotationsResolution(enabledElement, cornerstoneImageObject);
                }
                else if (!_this._isImageLoaded && !_this._resetParameters) {
                    // Image Resolution Change - enhance resolution from already loaded image
                    _this._adaptImageResolution(enabledElement, cornerstoneImageObject);
                    _this._adaptAnnotationsResolution(enabledElement, cornerstoneImageObject);
                }
                else {
                    throw new Error('Unknown state');
                }
                
                // save the resolutionScale for further uses (eg. image resolution change)
                _this._actualResolutionScale = cornerstoneImageObject.originalWidth / cornerstoneImageObject.width;

                // Trigger onImageLoading prior to image drawing
                // but after the viewport data is updated
                // Used to avoid multiple useless consecutive redrawing with tool
                // Particulary when a new image is drawn and the tool has to apply to each image
                _this.onImageLoading.trigger();
                
                // Display image
                //   force redraw because image binary changes, even if param do not (resetParameters the canvas size)
                //   cornerstone#displayImage can not be used because it doesn't allow to invalidate cornerstone cache
                // @warning !!! @warning in this case, cornerstone cache doesn't show a lower quality because the chosen
                // quality is always the topmost available in cache - @todo test this behavior !
                var invalidateCornerstoneCache = formerQuality != newQuality;
                var enabledElementObject = cornerstone.getEnabledElement(enabledElement); // enabledElementObject != enabledElementDom
                enabledElementObject.image = cornerstoneImageObject;
                cornerstone.updateImage(enabledElement, invalidateCornerstoneCache); // draw image & invalidate cornerstone cache
                $(enabledElementObject.element).trigger("CornerstoneImageRendered", {
                    viewport: enabledElementObject.viewport,
                    element : enabledElementObject.element,
                    image : enabledElementObject.image,
                    enabledElement : enabledElementObject,
                    canvasContext: enabledElementObject.canvas.getContext('2d')
                });
                
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