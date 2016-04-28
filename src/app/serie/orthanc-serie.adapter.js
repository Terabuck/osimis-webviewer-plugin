(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvOrthancSerieAdapter', wvOrthancSerieAdapter);

    /* @ngInject */
    function wvOrthancSerieAdapter(WvSerie) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(orthancSerie, orthancOrderedInstances, tags) {
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
            
            // check if image is single frame
            var isSingleFrame = imagesByInstance
                .filter(function(images) {
                    return images.length === 1;
                })
                .length === imagesByInstance.length; // each instances have only one image
            
            if (isSingleFrame) {
                // if image is mono frame, set one serie = many instances / mono frames
                var imagesBySerie = [_.flatten(imagesByInstance)];
            }
            else {
                // if image is multi frame, set one serie = one instance / many frames
                var imagesBySerie = imagesByInstance;
            }
            
            // instanciate serie objects
            var series = imagesBySerie.map(function(imageIds, serieIndex) {
                var id = orthancSerie.ID + ':' + serieIndex;
                tags = tags || orthancSerie.MainDicomTags;

                return new WvSerie(id, imageIds, tags);
            });

            return series;
        }
    }

})();