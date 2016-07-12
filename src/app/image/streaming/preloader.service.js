(function() {
    'use strict';

    angular
        .module('webviewer')
        .run(function($rootScope, wvSeriesManager, wvImageBinaryManager, WvImageQualities) {
            // @todo preload tags too ?

            // Preload thumbnail when user has selected a study (on left menu)
            $rootScope.$on('UserSelectedStudyId', function(evt, studyId) {
                wvSeriesManager
                    .listFromOrthancStudyId(studyId)
                    .then(function(seriesList) {
                        // Preload every series' thumbnails
                        seriesList.forEach(function(series) {
                            // Select the lowest quality available
                            var quality = Math.min.apply(Math, _.toArray(series.availableQualities));
                            for (var i=0; i<series.imageIds.length; ++i) {
                                var imageId = series.imageIds[i];

                                wvImageBinaryManager.requestLoading(imageId, quality, 2);
                            }
                        });
                    });
            });

            // Stop preloading when user has changed selected study (on left menu)
            $rootScope.$on('UserUnSelectedStudyId', function(evt, studyId) {
                wvSeriesManager
                    .listFromOrthancStudyId(studyId)
                    .then(function(seriesList) {
                        // Abort preloading
                        seriesList.forEach(function(series) {
                            // Select the lowest quality available
                            var quality = Math.min.apply(Math, _.toArray(series.availableQualities));
                            for (var i=0; i<series.imageIds.length; ++i) {
                                var imageId = series.imageIds[i];

                                wvImageBinaryManager.abortLoading(imageId, quality, 2);
                            }
                        });
                    });
            });

            // Preload series' when user has selected a series (dropped in a viewport)
            $rootScope.$on('UserSelectedSeries', function(evt, series) {
                // Select the lowest quality available
                var quality = Math.min.apply(Math, _.toArray(series.availableQualities));
                // Preload every series' thumbnails
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];

                    wvImageBinaryManager.requestLoading(imageId, quality, 1);
                }

                // Preload whole 1000x1000 studies images
                quality = WvImageQualities.MEDIUM;
                if (series.hasQuality(quality)) {
                    for (var i=0; i<series.imageIds.length; ++i) {
                        var imageId = series.imageIds[i];

                        wvImageBinaryManager.requestLoading(imageId, quality, 1);
                    }
                }

                // Preload lossless studies images
                quality = Math.max.apply(Math, _.toArray(series.availableQualities));
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];

                    wvImageBinaryManager.requestLoading(imageId, quality, 1);
                }
            });

            // Stop preloading when user has changed selected series (dropped in a viewport)
            $rootScope.$on('UserUnSelectedSeries', function(evt, series) {
                // Abort every series' thumbnails preloading
                var quality = Math.min.apply(Math, _.toArray(series.availableQualities));
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];

                    wvImageBinaryManager.abortLoading(imageId, quality, 1);
                }

                // Abort 1000x1000 studies images preloading
                quality = WvImageQualities.MEDIUM;
                if (series.hasQuality(quality)) {
                    for (var i=0; i<series.imageIds.length; ++i) {
                        var imageId = series.imageIds[i];

                        wvImageBinaryManager.abortLoading(imageId, quality, 1);
                    }
                }

                // Abort lossless studies images preloading
                quality = Math.max.apply(Math, _.toArray(series.availableQualities));
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];

                    wvImageBinaryManager.abortLoading(imageId, quality, 1);
                }
            });


            // $rootScope.$on('UserSelectedImageFromSeries', function(evt, image, series) {
                // Augment priority from image around

                // var index = series.indexOf(image.id) - series.imageCount
                // -5 + 5 ?
            // });

            // $rootScope.$on('UserUnSelectedImageFromSeries', function(image, series) {
                // var index = series.indexOf(image.id) - series.imageCount
                // -5 + 5 ?
            // });
        });
})();