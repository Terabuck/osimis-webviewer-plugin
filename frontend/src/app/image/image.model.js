/** class Image
 *
 * @RootAggregate
 *
 * This contains image id, tags, annotations & binaries.
 * an image either account for a DICOM instance (if the instance is monoframe), or a frame.
 *
 */
(function(module) {
    'use strict';

    function Image(imageBinaryManager, annotationManager, // injected values
                   id, tags, availableQualities, postProcesses
    ) {
        var _this = this;

        this._imageBinaryManager = imageBinaryManager;
        this._annotationManager = annotationManager;

        this.id = id;
        this.tags = tags;
        this._availableQualities = availableQualities;

        // collection of postprocesses
        this.postProcesses = postProcesses || [];

        this.onAnnotationChanged = new osimis.Listener();
        this.onBinaryLoaded = new osimis.Listener();

        this._feedAnnotationChangedEvents(this);
        this._feedBinaryLoadedEvents(this);
    }

    Image.prototype._feedAnnotationChangedEvents = function(imageModel) {
        this._annotationManager.onAnnotationChanged(function(annotation) {
            // filter events that are related to this image
            if (annotation.imageId !== imageModel.id) return;

            // propagate event
            imageModel.onAnnotationChanged.trigger(annotation);
        });

        // @todo need to be destroyed on no listener anymore
    };

    Image.prototype._feedBinaryLoadedEvents = function(imageModel) {
        this._imageBinaryManager.onBinaryLoaded(function(id, qualityLevel, cornerstoneImageObject) {
            // filter events that are related to this image
            if (id !== imageModel.id) return;

            // propagate event
            imageModel.onBinaryLoaded.trigger(qualityLevel, cornerstoneImageObject);
        });

        // @todo need to be destroyed on no listener anymore
    };

    /** Image#getAvailableQualities()
     *
     * @return available qualities as {<string>: <int>} array
     *
     */
    Image.prototype.getAvailableQualities = function() {
        return this._availableQualities;
    };

    /** Image#getAnnotations(type)
     *
     * @param type Annotation tool's name
     * @return cornerstoneTools' annotation array for one instance
     *
     */
    Image.prototype.getAnnotations = function(type) {
        return this._annotationManager.getByImageId(this.id, type);
    };

    /** Image#setAnnotations(type, data)
     *
     * @param type Annotation tool's name
     * @param data cornerstoneTools' annotation array for one instance
     *
     */
    Image.prototype.setAnnotations = function(type, data) {
        var annotation = new osimis.AnnotationValueObject(type, this.id, data);
        this._annotationManager.set(annotation);
    };

    /** Image#onAnnotationChanged(callback)
     *
     * @event called when one image's annotation has changed
     * @param callback function(annotation: WvAnnotationValueObject)
     *
     */
    Image.prototype.onAnnotationChanged = angular.noop;

    /** Image#loadBinary(desiredQualityLevel)
     * 
     * @param quality see ImageQualities
     * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
     *
     */
    Image.prototype.loadBinary = function(quality) {
        return this._imageBinaryManager.get(this.id, quality);
    };

    /** Image#freeBinary(quality)
     *
     * Free binary memory - note it doesn't mean the cache will be freed
     * as the cache logic is implemented by the image-binary-manager (and
     * probably work with reference counting and other specific mechanisms).
     *
     * @param quality: int the quality level of the binary to be freed
     *
     */
    Image.prototype.freeBinary = function(quality) {
        this._imageBinaryManager.free(this.id, quality);
    };

    /** Image#abortBinaryLoading(quality)
     *
     * Alias of freeBinary (if a request is pending, it's automaticaly canceled before its freed).
     *
     * @param quality: int the quality level of the binary to be freed
     *
     */
    Image.prototype.abortBinaryLoading = function(quality) {
        this._imageBinaryManager.free(this.id, quality);
    };

    /** Image#getBinaryOfHighestQualityAvailable()
     * 
     * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
     *
     */
    Image.prototype.getBestQualityInCache = function() {
        return this._imageBinaryManager.getBestQualityInCache(this.id);
    };

    /** Image#onBinaryLoaded(callback)
     *
     * @event called when a new binary has been loaded
     * @param callback function(qualityLevel: ImageQualities, binary: cornerstoneImageObject)
     *
     */
    Image.prototype.onBinaryLoaded = function() { /* noop */ };

    module.Image = Image;

    angular
        .module('webviewer')
        .factory('WvImage', factory);

    /* @ngInject */
    function factory(wvImageBinaryManager, wvAnnotationManager) {
        // Create and inject inject module
        return module.Image.bind(module, wvImageBinaryManager, this._annotationManager);
    }

})(this.osimis || (this.osimis = {}));