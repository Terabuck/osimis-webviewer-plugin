(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSerieRepository', wvSerieRepository);

    /* @ngInject */
    function wvSerieRepository($q, wvOrthancSerieAdapter, orthancApiService) {
        var service = {
            get: get
        };

        ////////////////

        function get(id) {
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

                    // @todo process instances
                    return wvOrthancSerieAdapter.process(orthancSerie, orthancOrderedInstances);
                });
        }

        return service;
    }
})();