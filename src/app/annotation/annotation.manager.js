(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvAnnotationManager', wvAnnotationManager);


    /* @ngInject */
    function wvAnnotationManager(WvAnnotationValueObject) {
    	var annotations = {};

        var service = {
            set: set,
            getByImageId: getByImageId,
            onAnnotationChanged: new osimis.Listener()
        };

        ////////////////

        function set(annotation) {
            // as annotations are stateless, we clone them to avoid unexpected behavior
            annotation = _.cloneDeep(annotation);
            
            annotations[annotation.type] = annotations[annotation.type] || {};
            annotations[annotation.type][annotation.imageId] = annotation;

            if (!annotation.data || (typeof annotation.data.length !== 'undefined' && annotation.data.length === 0)) {
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
                    // as annotations are stateless, we clone them to avoid unexpected behavior
                    .cloneDeep();
            }
        }
        
        return service;
    }
})();