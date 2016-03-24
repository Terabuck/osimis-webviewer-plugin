(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVAnnotationModel', factory);

    /* @ngInject */
    function factory() {
        
        /** new WVAnnotationModel(type, imageId, data)
         *
         * @ValueObject
         *
         * @note can contains *one or multiple annotation*:
         *   Cornerstone can have multiple annotations in one data object.
         *   For interoperability reasons, we keep it that way.
         */
        function WVAnnotationModel(type, imageId, data) {
            this.type = type;
            this.imageId = imageId;
            this.data = data;
        }
        
        ////////////////

        return WVAnnotationModel;
    }
})();