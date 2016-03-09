 (function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVImageModel', factory);

    /* @ngInject */
    function factory(wvAnnotation, WVAnnotationModel) {

        function WVImageModel(id, tags) {
            var _this = this;

            this.id = id;
            this.tags = tags;

            this.onAnnotationChanged = new osimis.Listener();
            
            wvAnnotation.onAnnotationChanged(function(annotation) {
                // @todo need to be destroyed on no listener anymore.

                if (annotation.imageId !== _this.id) return;

                _this.onAnnotationChanged.trigger(annotation);
            });
        }

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