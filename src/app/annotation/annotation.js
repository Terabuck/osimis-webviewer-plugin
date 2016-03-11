(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvAnnotation', wvAnnotation);


    /* @ngInject */
    function wvAnnotation(WVAnnotationModel) {
    	var annotations = {};

        var service = {
            set: set,
            getByImageId: getByImageId,
            onAnnotationChanged: new osimis.Listener()
        };

        ////////////////

        function set(annotation) {
            annotations[annotation.type] = annotations[annotation.type] || {};
            annotations[annotation.type][annotation.imageId] = annotation;

            if (!annotation.data) {
                delete annotations[annotation.type][annotation.imageId];
            }
            
            service.onAnnotationChanged.trigger(annotation);
        }

        function getByImageId(imageId, type) {
            if (type) {
                return annotations[type] && annotations[type][imageId];
            }
            else {
                return _(annotations)
                    .flatMap(function(annotationByTypes) {
                        return _.values(annotationByTypes);
                    })
                    .filter(function(annotation) {
                        return annotation.imageId === imageId;
                    })
                    .value();
            }
        }
        
        return service;
    }
})();