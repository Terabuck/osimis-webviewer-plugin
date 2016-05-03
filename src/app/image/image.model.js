(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WvImage', factory);

    /* @ngInject */
    function factory(wvAnnotationManager, WvAnnotationValueObject) {
        /*
         * @RootAggregate
         * @note wvImageManager is injected for lazy loading purpose
         */
        function WvImage(wvImageManager, id, tags, postProcesses) {
            var _this = this;

            this.id = id;
            this.tags = tags;

            // collection of postprocesses
            this.postProcesses = postProcesses || [];

            this.onAnnotationChanged = new osimis.Listener();
            
            wvAnnotationManager.onAnnotationChanged(function(annotation) {
                // @todo need to be destroyed on no listener anymore

                if (annotation.imageId !== _this.id) return;

                _this.onAnnotationChanged.trigger(annotation);
            });

            // @todo pass by parameter instead to avoid recursive dependency
            var _downloadStream = wvImageManager.getPixelObjectStream(id);

            _downloadStream.onImageReceived(function(pixelObjectPromise) {
                // tell when a better quality has been downloaded
                // used by the viewport to reload its canvas
                _this.onPixelObjectReceived.trigger(pixelObjectPromise);
            });
            this.askPixelObject = function() {
                // get raw image but event will retrieve intermediate compressed images meanwhile,
                return _downloadStream.getCompressedImage();;

                // @todo enable postprocessing back
                // var getPixelsObjectFromImageIdFn = wvImageManager.getPixelObject.bind(wvImageManager);

                // this.postProcesses.forEach(function(postProcess) {
                //     _cachedPixelObjectPromise = _cachedPixelObjectPromise
                //         .then(function(actualPixelObject) {
                //             return postProcess.execute(actualPixelObject, getPixelsObjectFromImageIdFn);
                //         });
                // });
                // result is not a 2d array of pixels but a cornerstone object containing an attribute with the array
            }
            this.onPixelObjectReceived = new osimis.Listener();

        }

        WvImage.prototype.getAnnotations = function(type) {
            return wvAnnotationManager.getByImageId(this.id, type);
        };

        WvImage.prototype.setAnnotations = function(type, data) {
            var annotation = new WvAnnotationValueObject(type, this.id, data);
            wvAnnotationManager.set(annotation);
        };

        ////////////////

        return WvImage;
    }
})();