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
        }

        ////////////////

        return WVImageModel;
    }
})();