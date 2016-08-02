(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvOrthancSeriesAdapter', wvOrthancSeriesAdapter);

    /* @ngInject */
    function wvOrthancSeriesAdapter(_, WvSeries, WvImageQualities) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(orthancSeries) {
            // Retrieve each image ids for each instance in one series
            var imagesByInstance = orthancSeries.instances
                // .reverse()
                .map(function(instance) {
                    var instanceId = instance[0];
                    var frameCount = instance[2];

                    var imageIds = [];
                    for (var frameIndex = 0; frameIndex < frameCount; ++frameIndex) {
                        imageIds.push(instanceId + ':' + frameIndex);
                    }

                    return imageIds;
                });
            
            // Check if image is single frame
            var isSingleFrame = imagesByInstance
                .filter(function(images) {
                    return images.length === 1;
                })
                .length === imagesByInstance.length; // each instances have only one image
            
            if (isSingleFrame) {
                // if image is mono frame, set one series = many instances / mono frames
                var imagesBySeries = [_.flatten(imagesByInstance)];
            }
            else {
                // if image is multi frame, set one series = one instance / many frames
                var imagesBySeries = imagesByInstance;
            }
            
            // Get tags
            var tags = orthancSeries.tags;
            
            // Convert available qualities into WvImageQualities format
            var availableQualities = _.pickBy(WvImageQualities, function(value, key) {
                // availableQualities (uppercase) has key
                for (var i=0; i<orthancSeries.availableQualities.length; ++i) {
                    var availableQuality = orthancSeries.availableQualities[i];

                    if (key === availableQuality.toUpperCase()) {
                        return true;
                    }
                };

                // availableQualities (uppercase) don't contain key
                return false;
            });

            // Throw exception on unknown quality
            if (_.size(availableQualities) !== orthancSeries.availableQualities.length) {
                throw new Error('unknown available quality in ' + orthancSeries.availableQualities);
            }

            // Instantiate series objects
            var seriesList = imagesBySeries.map(function(imageIds, seriesIndex) {
                var id = orthancSeries.id + ':' + seriesIndex;

                return new WvSeries(id, imageIds, tags, availableQualities);
            });

            return seriesList;
        }
    }

})();