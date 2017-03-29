/**
 * @ngdoc directive
 * @name webviewer.directive:wvSerieslist
 * 
 * @restrict Element
 *
 * @scope
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSerieslist', wvSerieslist);

    /* @ngInject */
    function wvSerieslist($q, wvSeriesManager, wvPdfInstanceManager, wvVideoManager) {
        var directive = {
            bindToController: true,
            controller: SerieslistVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                studyId: '=wvStudyId',
                selectedReportId: '=?wvSelectedReportId', // at the moment, true === an DICOM pdf id which end user has clicked on
                onStudyLoaded: '&?wvOnStudyLoaded' // For testing convenience
            },
            templateUrl: 'app/serieslist/serieslist.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            // Set initial values.
            vm.seriesIds = [];
            vm.pdfInstanceIds = [];
            vm.videos = [];

            // Adapt serieslist on input change.
            scope.$watch('vm.studyId', _setStudy);

            function _setStudy(id, old) {
                if (!id) return; 
                // @todo handle IsStable === false

                wvSeriesManager
                    .listFromOrthancStudyId(id)
                    .then(function(seriesList) {
                        // Set image series ids.
                        vm.seriesIds = seriesList.map(function(series) {
                            return series.id;
                        });

                        // Update video & pdf instance ids (once the series 
                        // have been loaded since the series manager request 
                        // will load the pdf instances too in one single HTTP
                        // request).
                        return $q.all({
                            videos: $q.all(wvVideoManager.listInstanceIdsFromOrthancStudyId(id)),
                            pdfInstances: $q.all(wvPdfInstanceManager.listFromOrthancStudyId(id))
                        });
                    })
                    .then(function(data) {
                        var videos = data.videos;
                        var pdfInstances = data.pdfInstances;

                        // Set pdf instances.
                        vm.pdfInstanceIds = _.keys(pdfInstances).length && pdfInstances.map(function(pdfInstance) {
                            return pdfInstance.id;
                        });

                        // Set video models.
                        vm.videos = videos;

                        // Trigger on-study-loaded (mainly for testing
                        // convenience).
                        if (vm.onStudyLoaded) {
                            vm.onStudyLoaded();
                        }
                    }, function(err) {
                        // Trigger on-study-loaded with the error.
                        if (vm.onStudyLoaded) {
                            vm.onStudyLoaded({$error: err})
                        }
                    });
            }
        }
    }

    /* @ngInject */
    function SerieslistVM() {
        this.openPdf = function(id) {
            // Adapt directive attribute
            this.selectedReportId = id;
        };
    }
  
})();