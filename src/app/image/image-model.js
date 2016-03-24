 (function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVImageModel', factory);

    /* @ngInject */
    function factory(wvAnnotationManager, WvAnnotationValueObject, wvImagePixels) {

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
            
            wvAnnotationManager.onAnnotationChanged(function(annotation) {
                // @todo need to be destroyed on no listener anymore

                if (annotation.imageId !== _this.id) return;

                _this.onAnnotationChanged.trigger(annotation);
            });

        }

        // with real pixels (for now)
        // this returns a promise
        WVImageModel.prototype.getPixelObject = function() {
            // @note resultPixels are not a 2d array of pixels but an object containing an attribute with the array
            var resultPromise = wvImagePixels.getPixelObject(this.id); // mainImagePixelObject
            var getPixelsObjectFromImageIdFn = wvImagePixels.getPixelObject.bind(wvImagePixels);

            this.postProcesses.forEach(function(postProcess) {
                resultPromise = resultPromise
                    .then(function(actualPixelObject) {
                        return postProcess.execute(actualPixelObject, getPixelsObjectFromImageIdFn);
                    });
            });
            
            return resultPromise;
        };

        WVImageModel.prototype.getAnnotations = function(type) {
            return wvAnnotationManager.getByImageId(this.id, type);
        };

        WVImageModel.prototype.setAnnotations = function(type, data) {
            var annotation = new WvAnnotationValueObject(type, this.id, data);
            wvAnnotationManager.set(annotation);
        };

        ////////////////

        return WVImageModel;
    }
})();