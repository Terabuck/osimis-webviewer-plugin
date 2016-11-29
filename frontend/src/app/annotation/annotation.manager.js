(function(osimis) {
    'use strict';

    function AnnotationManager() {
        this._annotations = {};

        this.onAnnotationChanged = new osimis.Listener();
    }

    AnnotationManager.prototype.onAnnotationChanged = function() { /* noop */ }; // see constructor

    AnnotationManager.prototype.set = function(annotation) {
        var annotations = this._annotations;

        // as annotations are stateless, we clone them to avoid unexpected behavior
        annotation = _.cloneDeep(annotation);
        
        annotations[annotation.type] = annotations[annotation.type] || {};
        annotations[annotation.type][annotation.imageId] = annotation;

        if (!annotation.data || (typeof annotation.data.length !== 'undefined' && annotation.data.length === 0)) {
            delete annotations[annotation.type][annotation.imageId];
        }
        
        this.onAnnotationChanged.trigger(annotation);
    };

    AnnotationManager.prototype.getByImageId = function(imageId, type) {
        var annotations = this._annotations;

        if (type) {
            // Return filtered annotations (by type)
            
            // as annotations are stateless, we clone them to avoid unexpected behavior
            return annotations[type] && _.cloneDeep(annotations[type][imageId]);
        }
        else {
            // Return all annotations
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
    };

    osimis.AnnotationManager = AnnotationManager;

    angular
        .module('webviewer')
        .factory('wvAnnotationManager', wvAnnotationManager);

    // Inject in angular
    
    /* @ngInject */
    function wvAnnotationManager() {
        return new AnnotationManager();
    }
})(this.osimis || (this.osimis = {}));