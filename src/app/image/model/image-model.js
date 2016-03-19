 (function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVImageModel', factory);

    /* @ngInject */
    function factory(wvAnnotation, WVAnnotationModel, wvImage) {

        /** 
         * @RootAggregate
         */
        function WVImageModel(id, tags, postProcesses) {
            var _this = this;

            this.id = id;
            this.tags = tags;

            // collection of postprocesses
            this.postProcesses = postProcesses || [];

            this.onAnnotationChanged = new osimis.Listener();
            
            wvAnnotation.onAnnotationChanged(function(annotation) {
                // @todo need to be destroyed on no listener anymore

                if (annotation.imageId !== _this.id) return;

                _this.onAnnotationChanged.trigger(annotation);
            });
        }

        // with real pixels (for now)
        WVImageModel.prototype.getPixels = function() {
            // @note resultPixels are not a 2d array of pixels but an object containing an attribute with the array
            var resultPixels = wvImage.getCompressedImage(this.id);
            var getImagePixelsFromIdFn = wvImage.getCompressedImage.bind(wvImage);

            // postprocess the pixels
            this.postProcesses.forEach(function(postProcess) {
                resultPixels = postProcess.execute(resultPixels, getImagePixelsFromIdFn);
            });

            return resultPixels;
        };

        WVImageModel.prototype.getAnnotations = function(type) {
            return wvAnnotation.getByImageId(this.id, type);
        };

        WVImageModel.prototype.setAnnotations = function(type, data) {
            var annotation = new WVAnnotationModel(type, this.id, data);
            wvAnnotation.set(annotation);
        };

        ////////////////

        return WVImageModel;
    }
})();