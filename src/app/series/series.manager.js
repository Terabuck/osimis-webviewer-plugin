(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSeriesManager', wvSeriesManager);

    /* @ngInject */
    function wvSeriesManager($q, $http, wvConfig, wvOrthancSeriesAdapter) {
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
            var seriesInfoPromise = $http.get(wvConfig.orthancApiURL + '/series/'+id, {cache: true});
            var orderedInstancePromise = $http.get(wvConfig.orthancApiURL + '/series/'+id+'/ordered-slices', {cache: true});

            return orderedInstancePromise
                .then(function(orderInstancesResult) {
                    // retrieve tags of the first series instance (once we have the first instance id)
                    var firstInstanceId = orderInstancesResult.data.SlicesShort[0][0];
                    var tagsPromise = $http.get(wvConfig.orthancApiURL + '/instances/'+firstInstanceId+'/simplified-tags', {cache: true});
                    
                    return $q.all({
                      orthancSeries: seriesInfoPromise,
                      orthancOrderedInstances: orderInstancesResult,
                      tags: tagsPromise
                    });
                })
                .then(function(args) {
                    // instanciate osiviewer seriesList from orthanc series
                    var orthancSeries = args.orthancSeries.data;
                    var orthancOrderedInstances = args.orthancOrderedInstances.data;
                    var tags = args.tags.data;

                    return wvOrthancSeriesAdapter.process(orthancSeries, orthancOrderedInstances, tags);
                });
        }

        function listFromOrthancStudyId(id) {
            return $http.get(wvConfig.orthancApiURL + '/studies/'+id, {cache: true})
                .then(function(response) {
                    var orthancStudy = response.data;
                    var orthancSeriesIds = orthancStudy.Series;
                    var wvSeriesPromises = orthancSeriesIds.map(function(orthancSeriesId) {
                        return service.listFromOrthancSeriesId(orthancSeriesId);
                    });
                    return $q.all(wvSeriesPromises);
                })
                .then(function(wvSeriesList) {
                    // wvSeriesList is 2d array w/ [orthancSeriesIndex][wvSeriesIndex]
                    // we need to flatten it to only keep wvSeriesList
                    wvSeriesList = _.flatten(wvSeriesList);
                    return wvSeriesList;
                });
        }

        return service;
    }
})();