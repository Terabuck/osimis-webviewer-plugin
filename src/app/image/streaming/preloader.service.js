(function() {
    'use strict';

    angular
        .module('webviewer')
        .run(function($rootScope, wvSeriesManager, wvImageBinaryManager, WvImageQualities) {
            // @todo preload tags too ?

            $rootScope.$on('UserSelectedStudyId', function(evt, studyId) {
                wvSeriesManager
                    .listFromOrthancStudyId(studyId)
                    .then(function(seriesList) {
                        // Preload every series' thumbnails
                        seriesList.forEach(function(series) {
                            for (var i=0; i<series.imageIds.length; ++i) {
                                var imageId = series.imageIds[i];
                                var quality = WvImageQualities.LOW;

                                wvImageBinaryManager.requestLoading(imageId, quality, 2);
                            }
                        });
                    });
            });

            $rootScope.$on('UserUnSelectedStudyId', function(evt, studyId) {
                wvSeriesManager
                    .listFromOrthancStudyId(studyId)
                    .then(function(seriesList) {
                        // Abort preloading
                        seriesList.forEach(function(series) {
                            for (var i=0; i<series.imageIds.length; ++i) {
                                var imageId = series.imageIds[i];
                                var quality = WvImageQualities.LOW;

                                wvImageBinaryManager.abortLoading(imageId, quality, 2);
                            }
                        });
                    });
            });

            $rootScope.$on('UserSelectedSeries', function(evt, series) {
                // Preload every series' thumbnails
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];
                    var quality = WvImageQualities.LOW;

                    wvImageBinaryManager.requestLoading(imageId, quality, 1);
                }

                // Preload whole 1000x1000 studies images
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];
                    var quality = WvImageQualities.MEDIUM;

                    wvImageBinaryManager.requestLoading(imageId, quality, 1);
                }

                // Preload lossless studies images
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];
                    var quality = WvImageQualities.LOSSLESS;

                    wvImageBinaryManager.requestLoading(imageId, quality, 1);
                }
            });

            $rootScope.$on('UserUnSelectedSeries', function(evt, series) {
                // Abort every series' thumbnails preloading
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];
                    var quality = WvImageQualities.LOW;

                    wvImageBinaryManager.abortLoading(imageId, quality, 1);
                }

                // Abort 1000x1000 studies images preloading
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];
                    var quality = WvImageQualities.MEDIUM;

                    wvImageBinaryManager.abortLoading(imageId, quality, 1);
                }

                // Abort lossless studies images preloading
                for (var i=0; i<series.imageIds.length; ++i) {
                    var imageId = series.imageIds[i];
                    var quality = WvImageQualities.LOSSLESS;

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