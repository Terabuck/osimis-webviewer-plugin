/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.ProgressiveImageLoader
 * @param {osimis.Image} image The image model to download quality from
 * @param {Array<osimis.quality>} qualities The array of quality to be downloaded
 * 
 * @description
 * The `ProgressiveImageLoader` class manage image resolution
 * loading (and loading abortion) for a viewport.
 *
 * It load multiple resolutions and make sure they are displayed
 * in order of quality.
 *
 * It is not the role of this class to handle resolution display changes & adaptions:
 * On each resolution change, the cornerstone annotations should be converted.
 * It's however not the role of this class since it requires drawing of the image
 * (to do otherwise could implies multiple useless redraw of the same binary).
 * The onBinaryLoaded event is here to help us concerning the drawing.
 */
(function(osimis) {
    'use strict';

    /**
     * @constructor osimis.ProgressiveImageLoader
     */
    function ProgressiveImageLoader(Promise, image, qualities) {
        this._Promise = Promise;
        this._image = image;
        this._qualities = qualities;
        
        this.onBinaryLoaded = new osimis.Listener(); // quality, cornerstoneImageObject
        this.onLoadingFailed = new osimis.Listener(); // quality, err

        // Used to be able to abort loadings when we change the displayed image
        this._binariesInLoading = [];

        // Store the last loaded image quality to free memory at each new reoslution loading.
        // Note the last loaded image may not be the last shown image
        // (for instance if the last loaded image has lower quality than the last
        // shown image)
        this._lastLoadedImageQuality = null;
    }

    /**
     * @ngdoc method
     * @methodOf osimis.ProgressiveImageLoader
     * 
     * @name osimis.ProgressiveImageLoader#loadBinaries
     *
     * @description
     * Pregressivily load all the image binaries defined fromù the qualities
     * set in the constructor.
     * Trigger `onBinaryLoaded` and `onLoadingFailed` events.
     */
    ProgressiveImageLoader.prototype.loadBinaries = function() {
        var _this = this;
        var Promise = this._Promise;
        var image = this._image;
        var qualities = this._qualities;
        var binariesInLoading = this._binariesInLoading;

        // Request load of the binaries of each processed image
        qualities.forEach(function(quality) {
            // Load the binary
            var promise = image.loadBinary(quality);

            // Save the loaded quality to be able to cancel the loading request if the displayer is destroyed
            binariesInLoading.push(quality);

            // On loaded, call the callback
            promise.then(function(cornerstoneImageObject) {
                // The binary has been loaded

                // Ignore lower resolution than if an higher one has already been loaded
                // to ensure the maximum quality to stay displayed and free the memory
                // of the inferior quality image
                if (_this._lastLoadedImageQuality > quality) {
                    image.freeBinary(quality);
                    return Promise.reject(new Error('LQ Loaded after HQ'));
                    // @note Things will be cleaned in `.then(null, function(err) { .. })`
                }
                // Free memory of previous downloaded image (when its quality is the lowest one)
                else if (_this._lastLoadedImageQuality) {
                    image.freeBinary(_this._lastLoadedImageQuality);
                }

                // Update last downloaded image reference so it can be freed later
                _this._lastLoadedImageQuality = quality;

                // @todo Abort lower resolution's loading
                
                // Remove the binary from the binariesInLoading queue (used to be able to cancel the loading request)
                _.pull(binariesInLoading, quality);

                // Call the "binary has loaded" callback
                // @warning Take care.. All callback's exceptions are swallowed by the current promise
                _this.onBinaryLoaded.trigger(quality, cornerstoneImageObject);
            })
            .then(null, function(err) {
                // Remove the binary from the binariesInLoading queue (used to be able to cancel the loading request)
                _.pull(binariesInLoading, quality);
                
                // Call loading cancelled callback when it's not normal behavior
                _this.onLoadingFailed.trigger(quality, err);
                if (err.message !== 'LQ Loaded after HQ') {
                //    _this.onLoadingFailed.trigger(quality, err);
                }
                else {
                    // Forward the rejection
                    return Promise.reject(err);
                }
            });

        });
    };

    /**
     * @ngdoc method
     * @methodOf osimis.ProgressiveImageLoader
     *
     * @name osimis.ProgressiveImageLoader#onBinaryLoaded
     * 
     * @param {callback} callback
     *    Called when a binary has been loaded.
     * 
     *    Parameters:
     *    * {osimis.quality} `quality` The quality of the binary.
     *    * {object} `cornerstoneImageObject` The cornerstone image object of 
     *                                        the loaded binary.
     */
    ProgressiveImageLoader.prototype.onBinaryLoaded = null;

    /**
     * @ngdoc method
     * @methodOf osimis.ProgressiveImageLoader
     *
     * @name osimis.ProgressiveImageLoader#onLoadingFailed
     * 
     * @param {callback} callback
     *    Called when a loading as failed. Ignored loaded images are not 
     *    considered as failed loadings (a LQ binary is ignored when loaded 
     *    after a HQ binary for instance).
     * 
     *    Parameters:
     *    * {osimis.quality} `quality` The quality of the binary.
     *    * {Error} `err` The thrown javascript error.
     */
    ProgressiveImageLoader.prototype.onLoadingFailed = null;

    /**
     * @ngdoc method
     * @methodOf osimis.ProgressiveImageLoader
     * 
     * @name osimis.ProgressiveImageLoader#abortBinariesLoading
     *
     * @description
     * Abort current binaries' loading. Mostly called by the `#destroy`
     * method.
     */
    ProgressiveImageLoader.prototype.abortBinariesLoading = function() {
        var image = this._image;
        
        // Cancel binary loading requests
        this._binariesInLoading.forEach(function(quality) {
            try {
                image.abortBinaryLoading(quality);
            }
            catch(exc) {
                // Ignore exceptions: they may be caused because
                // we try to free a binary whose download has been
                // successfuly cancelled by the binary manager but not
                // yet been removed from _binariesInLoading.
                // @todo check this theory w/ chrome timeline
                // @todo unit test
            }
        });
        this._binariesInLoading = [];

        // Free image binary
        var image = this._image;
        if (this._lastLoadedImageQuality) {
            // Free listeners
            image.freeBinary(this._lastLoadedImageQuality);
            image = null;
            this._lastLoadedImageQuality = null;
        }
    };

    /**
     * @ngdoc method
     * @methodOf osimis.ProgressiveImageLoader
     * 
     * @name osimis.ProgressiveImageLoader#destroy
     *
     * @description
     * Abort current binaries' loading and close `onBinaryLoaded` and 
     * `onLoadingFailed` listeners.
     */
    ProgressiveImageLoader.prototype.destroy = function() {
        this.abortBinariesLoading();

        // Free events
        this.onBinaryLoaded.close();
        this.onLoadingFailed.close();
    };

    osimis.ProgressiveImageLoader = ProgressiveImageLoader;

})(this.osimis || (this.osimis = {}));
