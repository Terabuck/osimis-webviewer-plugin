/**
 * @ngdoc directive
 * @name webviewer.directive:wvReportlist
 * 
 * @restrict Element
 *
 * @scope
 *
 * @param {string} wvStudyId
 * The id of the study.
 * 
 * @param {callback} [wvOnStudyLoaded=undefined]
 * Callback mainly used for unit test.
 *
 * @param {boolean} [wvSelectionEnabled=false]
 * Let the end-user select reports in the serieslist using a single click. This
 * selection has no impact on the standalone viewer. However, host applications
 * can retrieve the selection to do customized actions using the
 * `wvSelectedReportIds` parameter.
 *
 * @param {Array<string>} [wvSelectedReportIds=EmptyArray]
 * When `wvSelectionEnabled` is set to true, this parameter provide the list of
 * selected series as orthanc ids. This list can be retrieved to customize the
 * viewer by host applications.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvReportlist', wvReportlist);

    /* @ngInject */
    function wvReportlist($q, wvSeriesManager, wvPdfInstanceManager) {
        var directive = {
            bindToController: true,
            controller: ReportlistVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                studyId: '=wvStudyId',
                onStudyLoaded: '&?wvOnStudyLoaded', // For testing convenience

                // Selection-related
                selectionEnabled: '=?wvSelectionEnabled',
                selectedReportIds: '=?wvSelectedReportIds'
            },
            templateUrl: 'app/serieslist/reportlist.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            // Adapt serieslist on input change.
            scope.$watch('vm.studyId', _setStudy);

            function _setStudy(id, old) {
                if (!id) return; 
                // @todo handle IsStable === false

                // Clean selection
                // @todo Only cleanup when selection has not been reset at the
                // same time as the study id.
                vm.selectedReportIds = [];
                vm.loaded = false;

                wvSeriesManager
                    .listFromOrthancStudyId(id)
                    .then(function(seriesList) {
                        // Update video & pdf instance ids (once the series 
                        // have been loaded since the series manager request 
                        // will load the pdf instances too in one single HTTP
                        // request).
                        return $q.all(
                            wvPdfInstanceManager.listFromOrthancStudyId(id)
                        );
                    })
                    .then(function(pdfInstances) {
                        // Set pdf instances.
                        vm.pdfInstanceIds = _.keys(pdfInstances).length && pdfInstances.map(function(pdfInstance) {
                            return pdfInstance.id;
                        });
                        vm.loaded = true;

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
    function ReportlistVM() {
        // Set initial values.
        this.pdfInstanceIds = [];
        this.selectionEnabled = typeof this.selectionEnabled === 'undefined' ? false : this.selectionEnabled;
        this.selectedReportIds = this.selectedReportIds || [];

        this.toggleSelection = function(id) {
            // Do nothing if selection is disabled
            if (!this.selectionEnabled) {
                return;
            }

            // Activate selection for id
            if (this.selectedReportIds.indexOf(id) === -1) {
                this.selectedReportIds.push(id);
            }
            // Deactivate selection for id
            else {
                var index = this.selectedReportIds.indexOf(id);
                this.selectedReportIds.splice(index, 1);
            }
        };
    }
  
})();