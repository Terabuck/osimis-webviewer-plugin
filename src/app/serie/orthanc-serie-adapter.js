(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvOrthancSerieAdapter', wvOrthancSerieAdapter);

    /* @ngInject */
    function wvOrthancSerieAdapter(wvSerie) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(orthancSerie, orthancOrderedInstances) {
            orthancOrderedInstances = orthancOrderedInstances.SlicesShort.reverse().map(function(v) { return v[0]; });

        	var serie = wvSerie.create(orthancSerie.ID,
                orthancOrderedInstances,
                orthancSerie.MainDicomTags
                // orthancSerie.ParentStudy
                // orthancSerie.AnonymizedFrom
            );
            
        	return [
                serie
            ];
        }
    }

})();