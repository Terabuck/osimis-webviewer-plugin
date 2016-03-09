(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVAnnotationModel', factory);

    /* @ngInject */
    function factory() {

        function WVAnnotationModel(type, imageId, data) {
            this.type = type;
            this.imageId = imageId;
            this.data = data;
        }
        
        ////////////////

        return WVAnnotationModel;
    }
})();