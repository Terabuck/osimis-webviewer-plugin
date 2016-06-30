(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvOrthancSeriesAdapter', wvOrthancSeriesAdapter);

    /* @ngInject */
    function wvOrthancSeriesAdapter(WvSeries) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(orthancSeries, orthancOrderedInstances, tags) {
            // for each instance in one series, retrieve each image ids
            var imagesByInstance = orthancOrderedInstances.SlicesShort
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
            
            // check if image is single frame
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
            
            // instanciate series objects
            var seriesList = imagesBySeries.map(function(imageIds, seriesIndex) {
                var id = orthancSeries.ID + ':' + seriesIndex;
                tags = tags || orthancSeries.MainDicomTags;

                return new WvSeries(id, imageIds, tags);
            });

            return seriesList;
        }
    }

})();