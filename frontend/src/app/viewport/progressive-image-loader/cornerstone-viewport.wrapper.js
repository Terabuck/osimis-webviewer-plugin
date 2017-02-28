/**
 * @description 
 * This object wraps cornerstone viewport data object to handle progressive
 * image loading via multiple resolution. For conveniance, it keeps the initial
 * cornestone interface. Using Object#defineProperties is also the only way to
 * provide real time resolution conversion when cornerstone tools zoom/pan are 
 * being used but and the image resolution changes.
 * 
 * See `https://github.com/chafey/cornerstone/wiki/viewport` for the initial
 * CornerstoneJS viewport data object documentation.
 *
 * The only cornerstone methods that recreate a new viewport object are #reset,
 * #fitToWindow & #setCanvasSize (because both uses #reset). Therefore, those 
 * are the edge case we need to wrap outside this class. This is done in the
 * webviewer's viewport class.
 *
 * Warning: this object handles cornerstone viewport object's parameter
 * conversion for multi-resolution image loading. However, it doesn't handle 
 * the related annotation data's conversion.
 */
(function(osimis) {
    'use strict';

    function CornerstoneViewportWrapper(originalImageResolution, currentImageResolution, cornerstoneViewportData) {
        // Image resolution at full scale (the resolution from the dicom
        // pixeldata).
        this.originalImageResolution = originalImageResolution || {
            width: undefined,
            height: undefined
        };
        // The actual image resolution as currently loaded.
        this.currentImageResolution = currentImageResolution || {
            width: undefined,
            height: undefined
        };

        // Copy initial CornerstoneJS interface
        this._cornerstoneViewportData = cornerstoneViewportData || {
            scale: undefined, // resolution conversion will be done for this parameter
            translation: { // resolution conversion will be done for this parameter
                x: undefined,
                y: undefined
            },
            voi: {}, // not handled - left to cornerstone API
            invert: undefined,
            pixelReplication: undefined,
            hflip: undefined,
            vflip: undefined,
            rotation: undefined,
            modalityLUT: {}, // not handled - left to cornerstone API
            voiLUT: {} // not handled - left to cornerstone API
        };
    }

    CornerstoneViewportWrapper.prototype.clone = function() {
        return osimis.CornerstoneViewportWrapper.wrapCornerstoneViewport(
            this._cornerstoneViewportData,
            this.originalImageResolution,
            this.currentImageResolution
        );
    }

    /**
     * @return {[type]} [description]
     */
    CornerstoneViewportWrapper.prototype.serialize = function() {
        // Clone viewport data to make sure input wont be modified
        var csViewportData = _.cloneDeep(this._cornerstoneViewportData);

        // Normalize cornerstone data to the original image resolution 
        var csViewportSync = new osimis.CornerstoneViewportSynchronizer();
        csViewportSync.sync(csViewportData, this.currentImageResolution, this.originalImageResolution);

        // Return serialized object
        return {
            imageId: this.imageId,
            imageResolution: this.originalImageResolution,
            csViewportData: csViewportData
        };
    };

    CornerstoneViewportWrapper.deserialize = function(serializedObject) {
        return CornerstoneViewportWrapper.wrapCornerstoneViewport(
            serializedObject.csViewportData,
            serializedObject.imageResolution,
            serializedObject.imageResolution // Current Viewport's Image Resolution === Max Resolution when serialized (due to normazilation)
        );
    };

    // Adapt cornerstone scale and translate based to a new resolution
    CornerstoneViewportWrapper.prototype.changeResolution = function(newImageResolution) {
        // Make sure input wont be changed.
        newImageResolution = _.cloneDeep(newImageResolution);

        // Adapt scale & translation properties
        var csViewportSync = new osimis.CornerstoneViewportSynchronizer();
        csViewportSync.sync(this._cornerstoneViewportData, this.currentImageResolution, newImageResolution);

        // Cache current image resolution for next call
        this.currentImageResolution = newImageResolution;
    };

    // Resolution-dependent attribut may be set either via cornestone tools
    // (in terms of current resolution) or via wvb setters (in terms of 
    // original resolution). The original interface is kept only for
    // cornerstone interactions as the cornerstone interaction requires us 
    // to consider the current interface as the cornerstone one, whereas we 
    // can use a different interface for the wvb setters which need a 
    // different behavior. The cornerstone implementation uses pixels based on 
    // the current image resolution.
    CornerstoneViewportWrapper.wrapCornerstoneViewport = function(cornerstoneViewport, originalImageResolution, currentImageResolution) {
        // Make sure inputs wont be changed.
        cornerstoneViewport = _.cloneDeep(cornerstoneViewport);
        originalImageResolution = _.cloneDeep(originalImageResolution);
        currentImageResolution = _.cloneDeep(currentImageResolution);

        // Wrap viewport data
        var wrappedViewportDataObject = new CornerstoneViewportWrapper(
            originalImageResolution,
            currentImageResolution,
            cornerstoneViewport
        );

        // Return the wrapped object
        return wrappedViewportDataObject;
    };
    Object.defineProperties(CornerstoneViewportWrapper.prototype, {
        scale: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.scale;
            },
            set: function(value) {
                // When the scale is redefined, we make sure to convert it
                // from the current image resolution 
                this._cornerstoneViewportData.scale = value;
            }
        },
        translation: {
            configurable: false,
            enumerable: true,
            get: function() {
                // Cache translation wrapper to avoid recreating each time as 
                // it is very slow due to the `#defineProperties usage.
                if (!this._translationWrapper) {
                    this._translationWrapper = {};
                    var translation = this._cornerstoneViewportData.translation;
                    Object.defineProperties(this._translationWrapper, {
                        x: {
                            configurable: false,
                            enumerable: true,
                            get: function() {
                                return translation.x;
                            },
                            set: function(value) {
                                translation.x = value;
                            }
                        },
                        y: {
                            configurable: false,
                            enumerable: true,
                            get: function() {
                                return translation.y;
                            },
                            set: function(value) {
                                translation.y = value;
                            }
                        }
                    });
                }

                return this._translationWrapper;
            },
            set: function(value) {
                // Cache translation wrapper to avoid recreating each time as 
                // it is very slow due to the `#defineProperties usage.
                if (!this._translationWrapper) {
                    this._translationWrapper = {};
                    var translation = this._cornerstoneViewportData.translation;
                    Object.defineProperties(this._translationWrapper, {
                        x: {
                            get: function() {
                                return translation.x;
                            },
                            set: function(value) {
                                translation.x = value;
                            }
                        },
                        y: {
                            get: function() {
                                return translation.y;
                            },
                            set: function(value) {
                                translation.y = value;
                            }
                        }
                    });                    
                }

                this._translationWrapper.y = value.y;
                this._translationWrapper.x = value.x;
            }
        },
        voi: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.voi;
            },
            set: function(value) {
                this._cornerstoneViewportData.voi = value;
            }
        },
        invert: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.invert;
            },
            set: function(value) {
                this._cornerstoneViewportData.invert = value;
            }
        },
        pixelReplication: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.pixelReplication;
            },
            set: function(value) {
                this._cornerstoneViewportData.pixelReplication = value;
            }
        },
        hflip: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.hflip;
            },
            set: function(value) {
                this._cornerstoneViewportData.hflip = value;
            }
        },
        vflip: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.vflip;
            },
            set: function(value) {
                this._cornerstoneViewportData.vflip = value;
            }
        },
        rotation: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.rotation;
            },
            set: function(value) {
                this._cornerstoneViewportData.rotation = value;
            }
        },
        modalityLUT: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.modalityLUT;
            },
            set: function(value) {
                this._cornerstoneViewportData.modalityLUT = value;
            }
        },
        voiLUT: {
            configurable: false,
            enumerable: true,
            get: function() {
                return this._cornerstoneViewportData.voiLUT;
            },
            set: function(value) {
                this._cornerstoneViewportData.voiLUT = value;
            }
        }
    });

    osimis.CornerstoneViewportWrapper = CornerstoneViewportWrapper;

})(this.osimis || (this.osimis = {}));
