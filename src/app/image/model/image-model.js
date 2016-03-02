(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVImageModel', factory);

    /* @ngInject */
    function factory() {

        function WVImageModel(id, tags) {
            this.id = id;
            this.tags = tags;
            this.annotations = {};
            this.onAnnotationChanged = new osimis.Listener();
        }
        
        WVImageModel.prototype.getAnnotations = function(type) {
            return this.annotations[type];
        };

        WVImageModel.prototype.setAnnotations = function(type, data) {
            this.annotations[type] = data;
            this.onAnnotationChanged.trigger(type, data);
        };

        ////////////////

        return WVImageModel;
    }
})();