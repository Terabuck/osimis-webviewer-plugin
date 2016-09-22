(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSeriesManager', wvSeriesManager);

    /* @ngInject */
    function wvSeriesManager($rootScope, $q, WvHttpRequest, wvConfig, wvOrthancSeriesAdapter) {
        var service = {
            get: get,
            listFromOrthancSeriesId: listFromOrthancSeriesId,
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
                        var count = wvSeriesPromises.length;
                        var i = 0;
                        wvSeriesPromises.forEach(function(wvSeriesPromise) {
                            wvSeriesPromise.then(function(wvSeries) {
                                wvSeriesLists.push(wvSeries);
                                ++i;
                                // Resolve overall promise once every sub promises have been processed
                                if(i === count) {
                                    resolve(wvSeriesLists);
                                }
                            }, function(error) {
                                // @todo @warning forward failed promise somewhere!
                                console.error('Unable to retrieve a series.', error);
                                ++i;
                                // Resolve overall promise once every sub promises have been processed
                                if(i === count) {
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
                }, function(errors) {
                    console.error(errors);
                });
        }

        return service;
    }
})();