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
            // @todo bench this method
            var serieInfoPromise = $http.get(wvConfig.orthancApiURL + '/series/'+id);
            var orderedInstancePromise = $http.get(wvConfig.orthancApiURL + '/series/'+id+'/ordered-slices');

            return orderedInstancePromise
                .then(function(orderInstancesResult) {
                    // retrieve tags of the first serie instance (once we have the first instance id)
                    var firstInstanceId = orderInstancesResult.data.SlicesShort[0][0];
                    var tagsPromise = $http.get(wvConfig.orthancApiURL + '/instances/'+firstInstanceId+'/simplified-tags');
                    
                    return $q.all({
                      orthancSerie: serieInfoPromise,
                      orthancOrderedInstances: orderInstancesResult,
                      tags: tagsPromise
                    });
                })
                .then(function(args) {
                    // instanciate osiviewer series from orthanc serie
                    var orthancSerie = args.orthancSerie.data;
                    var orthancOrderedInstances = args.orthancOrderedInstances.data;
                    var tags = args.tags.data;

                    return wvOrthancSerieAdapter.process(orthancSerie, orthancOrderedInstances, tags);
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