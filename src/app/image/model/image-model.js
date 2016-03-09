(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVImageModel', factory);

    /* @ngInject */
    function factory(wvAnnotation) {

        function WVImageModel(id, tags) {
            var _this = this;

            this.id = id;
            this.tags = tags;

            this.onAnnotationChanged = new osimis.Listener();
            
            wvAnnotation.onAnnotationChanged(function(imageId, type, data) {
                // @todo need to be destroyed on no listener anymore.

                if (imageId !== _this.id) return;

                _this.onAnnotationChanged(type, data);
            });

        }
        
        WVImageModel.prototype.getAnnotations = function(type) {
            return wvAnnotation.getByImageId(this.id, type);
        };

        WVImageModel.prototype.setAnnotations = function(type, data) {
            wvAnnotation.setByImageId(this.id, type, data);            
        };

        ////////////////

        return WVImageModel;
    }
})();