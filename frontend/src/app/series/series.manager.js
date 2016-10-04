(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSeriesManager', wvSeriesManager);

    /* @ngInject */
    function wvSeriesManager($rootScope, $q, WvHttpRequest, wvConfig, wvOrthancSeriesAdapter) {
        var service = {
            /**
             * Retrieve a series from a frontend series id
             * 
             * @param {string} id Id of the series in wv format, where multiframe instances are considered as series
             *    format: <orthancSeriesId>:<instanceNumber>
             *    instanceNumber can be > 0 if the series contain multiframe instances
             * 
             * @return {promise<WvSeries>} The series model (wrapped in promise)
             */
            get: get,
            /**
             * Retrieve a list of frontend series from a backend series id
             * 
             * @param {string} id Id of the series in the orthanc format
             * 
             * @return {promise<array<WvSeries>>} A list of series model (wrapped in promise)
             */
            listFromOrthancSeriesId: listFromOrthancSeriesId,
            /**
             * Retrieve a list of frontend series from a backend study id
             *
             * @note There is no frontend study id
             * 
             * @param {string} id Id of the study (in the orthanc format)
             * 
             * @return {promise<array<WvSeries>>} A list of series model (wrapped in promise)
             */
            listFromOrthancStudyId: listFromOrthancStudyId
        };

        ////////////////

        function get(id) {
            var idHash = id.split(':');
            var orthancSeriesId = idHash[0];
            var subSeriesIndex = idHash[1] || 0;

            return service.listFromOrthancSeriesId(orthancSeriesId)
                .then(function(seriesList) {
                    return seriesList[subSeriesIndex];
                });
        }

        function listFromOrthancSeriesId(id) {
            // @todo bench this method
            var request = new WvHttpRequest();
            request.setHeaders(wvConfig.httpRequestHeaders);
            request.setCache(true);
            var seriesPromise = request.get(wvConfig.orthancApiURL + '/osimis-viewer/series/'+id);

            return seriesPromise
                .then(function(response) {
                    // @note One server-side multiframe series is converted into multiple front-end
                    // series, so the result is an array of series instead of a single one.
                    var seriesList = wvOrthancSeriesAdapter.process(response.data);

                    // Emit event when series have been loaded.
                    // This is notably used by image manager to cache available image qualities.
                    seriesList.forEach(function (series) {
                        $rootScope.$emit('SeriesHasBeenLoaded', series);
                    });

                    return seriesList;
                });
        }

        function listFromOrthancStudyId(id) {
            var request = new WvHttpRequest();
            request.setHeaders(wvConfig.httpRequestHeaders);
            request.setCache(true);
            return request.get(wvConfig.orthancApiURL + '/studies/'+id)
                .then(function(response) {
                    var orthancStudy = response.data;
                    var orthancSeriesIds = orthancStudy.Series;
                    var wvSeriesPromises = orthancSeriesIds.map(function(orthancSeriesId) {
                        return service.listFromOrthancSeriesId(orthancSeriesId);
                    });
                    
                    // Retrieve every wv-series' ids from orthanc-series ids.
                    // @note This does the same as $q.all, except it doesn't stop if one single promise fails.
                    return $q(function(resolve, reject) {
                        var wvSeriesLists = [];
                        var _failedResults = []; // @todo @warning forward failed promise somewhere! (the issue here is we must bypass failed request (for SR/bad DICOM tolerance)),
                                                 // so we must "resolve" failing promises, while we most reject them at the same times). Promise can't handle these use cases, either
                                                 // they fails or succeed but not both, they can't succeed partly.
                        var i = 0;
                        wvSeriesPromises.forEach(function(wvSeriesPromise) {
                            wvSeriesPromise.then(function(wvSeries) {
                                wvSeriesLists.push(wvSeries);
                                ++i;
                                // Resolve overall promise once every sub promises have been processed
                                if(i === wvSeriesPromises.length) {
                                    resolve(wvSeriesLists);
                                }
                            }, function(error) {
                                _failedResults.push(error);
                                console.error('Unable to retrieve a series.', error);
                                ++i;
                                // Resolve overall promise once every sub promises have been processed
                                if(i === wvSeriesPromises.length) {
                                    // Resolve the overall promise even if one of the sub-promise fails.
                                    resolve(wvSeriesLists);
                                }
                            })
                        })
                    });
                })
                .then(function(wvSeriesList) {
                    // wvSeriesList is 2d array w/ [orthancSeriesIndex][wvSeriesIndex]
                    // we need to flatten it to only keep wvSeriesList
                    wvSeriesList = _.flatten(wvSeriesList);
                    return wvSeriesList;
                }, function(err) {
                    console.error(err);
                    return $q.reject(err); 
                });
        }

        return service;
    }
})();