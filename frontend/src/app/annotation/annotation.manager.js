/**
 * @ngdoc service
 *
 * @name webviewer.service:wvAnnotationManager
 *
 * @description
 * Manager images' annotations.
 */
(function(osimis) {
    'use strict';

    function AnnotationManager() {
        this._annotations = {};

        this.onAnnotationChanged = new osimis.Listener();
    }

    /**
     * @ngdoc method
     * @methodOf webviewer.service:wvAnnotationManager
     *
     * @name osimis.AnnotationManager#onAnnotationChanged
     * 
     * @param {callback} callback
     *    Called when an annotation has changed
     * 
     *    Parameters:
     *    * {object} `annotation` The modified annotation
     */
    AnnotationManager.prototype.onAnnotationChanged = function() { /* noop */ }; // see constructor

    /**
     * @ngdoc method
     * @methodOf webviewer.service:wvAnnotationManager
     *
     * @name osimis.AnnotationManager#set
     * 
     * @param {object} annotation The annotation
     */
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

    /**
     * @ngdoc method
     * @methodOf webviewer.service:wvAnnotationManager
     *
     * @name osimis.AnnotationManager#getByImageId
     * 
     * @param {string} imageId The image id 
     * @param {string} [type] 
     *    If set, either one of those value:
     *    * The annotation type
     *    * The related cornestone tool's name
     *    If undefined, all the available annotations will be returned.
     * @return {Array<object>} The list of annotation returned
     */
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

    // Inject in angular
    
    angular
        .module('webviewer')
        .factory('wvAnnotationManager', wvAnnotationManager);

    /* @ngInject */
    function wvAnnotationManager() {
        return new AnnotationManager();
    }
})(this.osimis || (this.osimis = {}));