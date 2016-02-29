(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSerieRepository', wvSerieRepository);

    /* @ngInject */
    function wvSerieRepository($q, wvOrthancSerieAdapter, orthancApiService) {
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
            var serieInfoPromise = orthancApiService
              .serie.get({id: id})
              .$promise;
            var orderedInstancePromise = orthancApiService
               .serie.listInstances({id: id})
               .$promise;

            return $q
                .all({
                  orthancSerie: serieInfoPromise,
                  orthancOrderedInstances: orderedInstancePromise
                })
                .then(function(args) {
                    var orthancSerie = args.orthancSerie;
                    var orthancOrderedInstances = args.orthancOrderedInstances;

                    return wvOrthancSerieAdapter.process(orthancSerie, orthancOrderedInstances);
                });
        }

        function listFromOrthancStudyId(id) {
            return orthancApiService
                .study
                .get({
                    id: id
                })
                .$promise
                .then(function(orthancStudy) {
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