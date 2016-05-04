(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WvImage', factory);

    /* @ngInject */
    function factory(wvImageBinaryManager, wvAnnotationManager, WvAnnotationValueObject, WvImageQualities) {
        /** class WvImage
         *
         * @RootAggregate
         *
         * This contains image id, tags, annotations & binaries.
         * an image either account for a DICOM instance (if the instance is monoframe), or a frame.
         *
         */
        function WvImage(wvImageManager, id, tags, postProcesses) {
            var _this = this;

            this.id = id;
            this.tags = tags;

            // collection of postprocesses
            this.postProcesses = postProcesses || [];

            this.onAnnotationChanged = new osimis.Listener();
            this.onBinaryLoaded = new osimis.Listener();

            _feedAnnotationChangedEvents(this);
            _feedBinaryLoadedEvents(this);
        }

        /** WvImage#getAnnotations(type)
         *
         * @param type Annotation tool's name
         * @return cornerstoneTools' annotation array for one instance
         *
         */
        WvImage.prototype.getAnnotations = function(type) {
            return wvAnnotationManager.getByImageId(this.id, type);
        };

        /** WvImage#setAnnotations(type, data)
         *
         * @param type Annotation tool's name
         * @param data cornerstoneTools' annotation array for one instance
         *
         */
        WvImage.prototype.setAnnotations = function(type, data) {
            var annotation = new WvAnnotationValueObject(type, this.id, data);
            wvAnnotationManager.set(annotation);
        };

        /** WvImage#onAnnotationChanged(callback)
         *
         * @event called when one image's annotation has changed
         * @param callback function(annotation: WvAnnotationValueObject)
         *
         */
        WvImage.prototype.onAnnotationChanged = angular.noop;

        /** WvImage#loadBinary(desiredQualityLevel)
         * 
         * @param desiredQualityLevel see WvImageQualities
         *        note the manager may load intermediate image qualities
         *        those can be retrieved using the onBinaryLoaded event
         * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
         *
         */
        WvImage.prototype.loadBinary = function(desiredQualityLevel) {
            return wvImageBinaryManager.get(this.id, desiredQualityLevel);
        };

        /** WvImage#getBinaryOfHighestQualityAvailable()
         * 
         * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
         *
         */
        WvImage.prototype.getBinaryOfHighestQualityAvailable = function() {
            return wvImageBinaryManager.getCachedHighestQuality(this.id);
        };

        /** WvImage#onBinaryLoaded(callback)
         *
         * @event called when a new binary has been loaded
         * @param callback function(qualityLevel: WvImageQualities, binary: cornerstoneImageObject)
         *
         */
        WvImage.prototype.onBinaryLoaded = angular.noop;

        ////////////////

        function _feedAnnotationChangedEvents(imageModel) {
            wvAnnotationManager.onAnnotationChanged(function(annotation) {
                // filter events that are related to this image
                if (annotation.imageId !== imageModel.id) return;

                // propagate event
                imageModel.onAnnotationChanged.trigger(annotation);
            });

            // @todo need to be destroyed on no listener anymore
        }

        function _feedBinaryLoadedEvents(imageModel) {
            wvImageBinaryManager.onBinaryLoaded(function(id, qualityLevel, cornerstoneImageObject) {
                // filter events that are related to this image
                if (id !== imageModel.id) return;

                // propagate event
                imageModel.onBinaryLoaded.trigger(qualityLevel, cornerstoneImageObject);
            });

            // @todo need to be destroyed on no listener anymore
        }

        ////////////////

        return WvImage;
    }
})();