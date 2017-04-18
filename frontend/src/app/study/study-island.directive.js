/**
 * @ngdoc directive
 * @name webviewer.directive:wvWebviewer
 *
 * @scope
 * @restrict E
 *
 * @param {string} wvStudyId
 * The id of the shown study.
 *
 * @param {boolean} [wvSeriesItemSelectionEnabled=false]
 * When this parameter is enabled, the study's items can be selected by the
 * end-user using the left mouse click.
 *
 * @param {Array<string>} [wvSelectedSeriesIds=EmptyArray]
 * An array containing the ids of the selected series.
 * 
 * @param {Array<string>} [wvSelectedReportIds=EmptyArray]
 * An array containing the ids of the selected reports.
 * 
 * @param {Array<string>} [wvSelectedVideoIds=EmptyArray]
 * An array containing the ids of the selected videos.
 *
 * @description
 * The `wvStudyIsland` displays a study. It shows all the items contained in
 * that study. Those element can then be dropped in viewports.
 **/
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvStudyIsland', wvStudyIsland);

    /* @ngInject */
    function wvStudyIsland(wvConfig) {
        var directive = {
            bindToController: true,
            controller: StudyIslandVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                studyId: '=wvStudyId',
                seriesItemSelectionEnabled: '=?wvSeriesItemsSelectionEnabled', // default: false
                selectedSeriesIds: '=?wvSelectedSeriesIds',
                selectedReportIds: '=?wvSelectedReportIds',
                selectedVideoIds: '=?wvSelectedVideoIds'

            },
            templateUrl: 'app/study/study-island.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            // load study informations
            vm.studyTags = {};
            vm.patientTags = {};
            scope.$watch('vm.studyId', function(newStudyId) {
                if (!newStudyId) return; // @todo hide directive

                var request = new osimis.HttpRequest();
                request.setHeaders(wvConfig.httpRequestHeaders);
                request.setCache(true);

                request
                    .get(wvConfig.orthancApiURL + '/studies/'+newStudyId)
                    .then(function(response) {
                        var study = response.data;
                        vm.studyTags = study.MainDicomTags;
                        vm.patientTags = study.PatientMainDicomTags;

                        // format datas
                        function _convertDate(date) {
                            return date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, '$1/$2/$3');
                        }
                        vm.studyTags.StudyDate = vm.studyTags.StudyDate && _convertDate(vm.studyTags.StudyDate);
                        vm.patientTags.PatientBirthDate = vm.patientTags.PatientBirthDate && _convertDate(vm.patientTags.PatientBirthDate);
                    });
            });

            // Selection-related
            vm.seriesItemSelectionEnabled = typeof vm.seriesItemSelectionEnabled !== 'undefined' ? vm.seriesItemSelectionEnabled : false;
            vm.selectedSeriesIds = vm.selectedSeriesIds || [];
            vm.selectedReportIds = vm.selectedReportIds || [];
            vm.selectedVideoIds = vm.selectedVideoIds || [];
        }
    }

    /* @ngInject */
    function StudyIslandVM() {

    }
})();