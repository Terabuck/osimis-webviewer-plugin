(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageModel', wvImageModel);

    /* @ngInject */
    function wvImageModel() {
        var service = {
        	create: create,
            class: WVImage
        };

        ////////////////

        function create(id, tags) {
        	return new WVImage(id, tags);
        }

        function WVImage(id, tags) {
            this.id = id;
            this.tags = tags;
        }

        ////////////////

        return service;
    }
})();