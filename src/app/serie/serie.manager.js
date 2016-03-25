(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSerieManager', wvSerieManager);

    /* @ngInject */
    function wvSerieManager($q, $http, wvConfig, wvOrthancSerieAdapter) {
        var service = {
            get: get,
            listFromOrthancSerieId: listFromOrthancSerieId,
            listFromOrthancStudyId: listFromOrthancStudyId
        };

        ////////////////

        function get(id) {
            var idHash = id.split(':');
            var orthancSerieId = idHash[0];
            var subSerieIndex = idHash[1] || 0;

            return service.listFromOrthancSerieId(orthancSerieId)
                .then(function(series) {
                    return series[subSerieIndex];
                });
        }

        function listFromOrthancSerieId(id) {
            var serieInfoPromise = $http.get(wvConfig.orthancApiURL + '/series/'+id);
            var orderedInstancePromise = $http.get(wvConfig.orthancApiURL + '/series/'+id+'/ordered-slices');

            return $q
                .all({
                  orthancSerie: serieInfoPromise,
                  orthancOrderedInstances: orderedInstancePromise
                })
                .then(function(args) {
                    var orthancSerie = args.orthancSerie.data;
                    var orthancOrderedInstances = args.orthancOrderedInstances.data;

                    return wvOrthancSerieAdapter.process(orthancSerie, orthancOrderedInstances);
                });
        }

        function listFromOrthancStudyId(id) {
            return $http.get(wvConfig.orthancApiURL + '/studies/'+id)
                .then(function(response) {
                    var orthancStudy = response.data;
                    var orthancSerieIds = orthancStudy.Series;
                    var wvSeriePromises = orthancSerieIds.map(function(orthancSerieId) {
                        return service.listFromOrthancSerieId(orthancSerieId);
                    });
                    return $q.all(wvSeriePromises);
                })
                .then(function(wvSeries) {
                    // wvSeries is 2d array w/ [orthancSerieIndex][wvSerieIndex]
                    // we need to flatten it to only keep wvSeries
                    wvSeries = _.flatten(wvSeries);
                    return wvSeries;
                });
        }

        return service;
    }
})();