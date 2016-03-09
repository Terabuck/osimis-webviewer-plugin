(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvAnnotation', wvAnnotation);


    /* @ngInject */
    function wvAnnotation() {
    	var annotations = {};

        var service = {
            getByImageId: getByImageId,
            setByImageId: setByImageId,
            onAnnotationChanged: new osimis.Listener()
        };

        ////////////////

        function getByImageId(imageId, type) {
        	return annotations[type] && annotations[type][imageId];
        }

        function setByImageId(imageId, type, data) {
        	annotations[type] = annotations[type] || {};
        	annotations[type][imageId] = data;
        	service.onAnnotationChanged.trigger(imageId, type, data);
        }

        return service;
    }
})();