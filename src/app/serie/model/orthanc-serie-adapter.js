(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvOrthancSerieAdapter', wvOrthancSerieAdapter);

    /* @ngInject */
    function wvOrthancSerieAdapter(wvSerie) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(orthancSerie, orthancOrderedInstances) {
            // for each instance in one serie, retrieve each image ids
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
            
            var isSingleFrame = imagesByInstance
                .filter(function(images) {
                    return images.length === 1;
                })
                .length === imagesByInstance.length; // each instances have only one image

            if (isSingleFrame) {
                var imagesBySerie = [_.flatten(imagesByInstance)];
            }
            else {
                var imagesBySerie = imagesByInstance;
            }

            var series = imagesBySerie.map(function(imageIds, serieIndex) {
                var serie = wvSerie.create(
                    orthancSerie.ID + ':' + serieIndex,
                    imageIds,
                    orthancSerie.MainDicomTags
                );

                return serie;
            });

            return series;
        }
    }

})();