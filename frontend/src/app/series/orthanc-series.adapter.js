/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.OrthancSeriesAdapter
 */
(function(osimis) {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvOrthancSeriesAdapter', wvOrthancSeriesAdapter);

    /* @ngInject */
    function wvOrthancSeriesAdapter(_, WvSeries) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(orthancSeries) {
            // Get tags
            var tags = orthancSeries.tags;
            
            // When series has no image (for instance for a DICOM PDF 
            // instance), ignore the series.
            if (!orthancSeries.availableQualities) {
                // Assert it's not an image series.
                if (tags.MIMETypeOfEncapsulatedDocument !== 'application/pdf') {
                    throw new Error('Empty available qualities for non `application/pdf` series');
                }

                // Ignore the series since it's a pdf-instance, return an
                // empty array.
                else {
                    return [];
                }
            }

            // Retrieve each pdf ids for each instances in one series
            var pdfInstanceIds = orthancSeries.instances
                // Check if instance has PDF mimetype
                .filter(function(instance) {
                    var instanceId = instance[0];
                    var frameCount = instance[2];
                    return orthancSeries.instancesTags[instanceId].MIMETypeOfEncapsulatedDocument === 'application/pdf';
                })
                // Convert instances `ordered-slices` orthanc model into a list of id
                .map(function(instance) {
                    var instanceId = instance[0];
                    return instanceId;
                });
            
            // Retrieve each image ids & pdf ids for each instance in one series
            var imageIdsByInstance = orthancSeries.instances
                // Ignore pdf instances
                .filter(function(instance) {
                    var instanceId = instance[0];

                    return pdfInstanceIds.indexOf(instanceId) === -1;
                })
                // Group imageIds by instance
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
            var isSingleFrame = imageIdsByInstance
                .filter(function(images) {
                    return images.length === 1;
                })
                .length === imageIdsByInstance.length; // each instances have only one image
            
            if (isSingleFrame) {
                // if image is mono frame, set one series = many instances / mono frames
                // this is also set when series have no instances
                var imageIdsBySeries = [_.flatten(imageIdsByInstance)];
            }
            else {
                // if image is multi frame, set one series = one instance / many frames
                var imageIdsBySeries = imageIdsByInstance;
            }
            
            // Convert available qualities into osimis.quality format when 
            // series contains image.
            var availableQualities = _.pickBy(osimis.quality, function(value, key) {
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
            // @todo add isPdf attribute?
            // @todo merge imageIdsBySeries & pdfInstances 
            // @todo map to wvSeries
            var seriesList = imageIdsBySeries.map(function(imageIds, seriesIndex) {
                var id = orthancSeries.id + ':' + seriesIndex;

                return new WvSeries(id, imageIds, [], tags, availableQualities);
            });

            return seriesList;
        }
    }

})(this.osimis || (this.osimis = {}));