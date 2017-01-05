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
        // Hash: invariant is _annotations[type][imageId] === AnnotationValueObject
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
     * @name osimis.AnnotationManager#getAll
     * 
     * @return {object} All the annotations (as cornerstone annotations).
     *
     * @description
     * The `getAll` only intent is to provide backup of annotations for
     * storage. For instance LiveShare.
     */
    AnnotationManager.prototype.getAll = function() {
        var annotations = this._annotations;

        return _.cloneDeep(annotations);
    };

    /**
     * @ngdoc method
     * @methodOf webviewer.service:wvAnnotationManager
     *
     * @name osimis.AnnotationManager#setAll
     * 
     * @param {object} annotations All the annotations (as cornerstone
     *                             annotations).
     *
     * @description
     * Primary intent is to retrieve backup of annotations from storage. For
     * instance LiveShare.
     */
    AnnotationManager.prototype.setAll = function(annotations) {
        // Update the annotations
        this._annotations = annotations; // No need for deep clone, we trust
                                         // method's users to not change the
                                         // object.

        // Trigger events
        for (var type in this._annotations) {
            if (this._annotations.hasOwnProperty(type)) {
                for (var imageId in this._annotations[type]) {
                    if (this._annotations[type].hasOwnProperty(imageId)) {
                        // Trigger `onAnnotationChanged event
                        var annotation = this._annotations[type][imageId];
                        this.onAnnotationChanged.trigger(annotation);

                        // @todo Recreate the model based on the class (no need
                        //       yet since the model has no method).
                    }
                }
            }
        }


        // // Regenerate annotations based on AnnotationValueObject model, only
        // // to trigger `onAnnotationChanged` events.

        // // Sync removed annotations.
        // for (var type in this._annotations) {
        //     if (this._annotations.hasOwnProperty(type)) {
        //         var annotationsByType = imageId;
        //         for (var imageId in annotationsByType) {
        //             if (annotationByType.hasOwnProperty(imageId)) {
        //                 if (!annotations || !annotations[type] || !annotations[type][imageId]) {
        //                     // Create an empty AnnotationValueObject
        //                     var annotationValueObject = new AnnotationValueObject(
        //                         type,
        //                         imageId,
        //                         null
        //                     );

        //                     // Remove annotation & trigger update event
        //                     this.set(annotationValueObject)
        //                 }
        //             }
        //         }
        //     }
        // }

        // // Sync new/existing annotations.
        // for (var type in annotations) {
        //     if (annotations.hasOwnProperty(type)) {
        //         var annotationsByType = imageId;
        //         for (var imageId in annotationsByType) {
        //             if (annotationByType.hasOwnProperty(imageId)) {
        //                 if (this._annotations && this._annotations[type] && this._annotations[type][imageId]) {
        //                     // Create an empty AnnotationValueObject
        //                     var data = annotations[type][imageId];
        //                     var annotationValueObject = new AnnotationValueObject(
        //                         type,
        //                         imageId,
        //                         data
        //                     );

        //                     // Sync annotation & trigger update event
        //                     this.set(annotationValueObject)
        //                 }
        //             }
        //         }
        //     }
        // }
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