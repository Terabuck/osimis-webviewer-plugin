/**
 * @ngdoc directive
 * @name webviewer.directive:wvSerieslist
 * 
 * @restrict Element
 *
 * @transclude
 * @scope
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSerieslist', wvSerieslist);

    /* @ngInject */
    function wvSerieslist($q, wvSeriesManager, wvPdfInstanceManager) {
        var directive = {
            bindToController: true,
            controller: SerieslistVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                studyId: '=wvStudyId',
                selectedReportId: '=?wvSelectedReportId', // at the moment, === DICOM pdf id
                cssClassTmp: '=?wvClass',
                onStudyLoaded: '&?wvOnStudyLoaded' // For testing convenience
            },
            transclude: true,
            templateUrl: 'app/serieslist/serieslist.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            // @todo make sure there is enough space left for the overlay bar in html

            // Set initial values.
            vm.seriesIds = [];
            vm.pdfInstanceIds = [];

            // Adapt serieslist on input change.
            scope.$watchCollection('vm.cssClassTmp', function() {
                _setDefaultCssClasses();
            });
            scope.$watch('vm.studyId', _setStudy);

            function _setStudy(id, old) {
                if (!id) return; 
                // @todo handle IsStable === false

                wvSeriesManager
                    .listFromOrthancStudyId(id)
                    .then(function(seriesList) {
                        vm.seriesIds = seriesList.map(function(series) {
                            return series.id;
                        });

                        // Update pdf instance ids (once the series have been
                        // loaded since the series manager request will load
                        // the pdf instances too in one single HTTP request).
                        return $q.all(wvPdfInstanceManager.listFromOrthancStudyId(id));
                    })
                    .then(function(pdfInstances) {
                        vm.pdfInstanceIds = _.keys(pdfInstances).length && pdfInstances.map(function(pdfInstance) {
                            return pdfInstance.id;
                        });
    
                        // Trigger on-study-loaded (mainly for testing convenience)
                        if (vm.onStudyLoaded) {
                            vm.onStudyLoaded();
                        }
                    }, function(err) {
                        // Trigger on-study-loaded with the error
                        if (vm.onStudyLoaded) {
                            vm.onStudyLoaded({$error: err})
                        }
                    });
            }

            function _setDefaultCssClasses() {
                vm.cssClass = vm.cssClassTmp || {};
  
                var cssClasses = {
                    ul: vm.cssClass.ul || 'wv-serieslist',
                    li: vm.cssClass.li || 'wv-serieslist-item',
                    overlay: vm.cssClass.ul || 'wv-serieslist-overlay',
                    report: vm.cssClass.report || 'wv-serieslist-report',
                    reporticon: vm.cssClass.reporticon || 'wv-serieslist-reporticon',
                    reportlabel: vm.cssClass.reportlabel || 'wv-serieslist-reportlabel',
                    noreport: vm.cssClass.noreport || 'wv-serieslist-noreport',
                    noreporticon: vm.cssClass.noreporticon || 'wv-serieslist-noreporticon',
                    noreportlabel: vm.cssClass.noreportlabel || 'wv-serieslist-noreportlabel'
                };
                
                vm.cssClass = cssClasses;
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