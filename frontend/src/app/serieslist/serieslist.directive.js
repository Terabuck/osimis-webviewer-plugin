/**
 * @ngdoc directive
 * @name webviewer.directive:wvSerieslist
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
 * Let the end-user select series in the serieslist using a single click. This
 * selection has no impact on the standalone viewer. However, host applications
 * can retrieve the selection to do customized actions using the
 * `wvSelectedSeriesIds` parameter.
 *
 * @param {Array<string>} [wvSelectedSeriesIds=EmptyArray]
 * When `wvSelectionEnabled` is set to true, this parameter provide the list of
 * selected series as orthanc ids. This list can be retrieved to customize the
 * viewer by host applications.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSerieslist', wvSerieslist);

    /* @ngInject */
    function wvSerieslist($q, wvSeriesManager) {
        var directive = {
            bindToController: true,
            controller: SerieslistVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                studyId: '=wvStudyId',
                onStudyLoaded: '&?wvOnStudyLoaded', // For testing convenience

                // Selection-related
                selectionEnabled: '=?wvSelectionEnabled',
                selectedSeriesIds: '=?wvSelectedSeriesIds'
            },
            templateUrl: 'app/serieslist/serieslist.directive.html'
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
                vm.selectedSeriesIds = [];
                vm.loaded = false;

                wvSeriesManager
                    .listFromOrthancStudyId(id)
                    .then(function(seriesList) {
                        // Set image series ids.
                        vm.seriesIds = seriesList.map(function(series) {
                            return series.id;
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
    function SerieslistVM() {
        // Set initial values.
        this.seriesIds = [];
        this.selectionEnabled = typeof this.selectionEnabled === 'undefined' ? false : this.selectionEnabled;
        this.selectedSeriesIds = this.selectedSeriesIds || [];

        this.toggleSelection = function(seriesId) {
            // Do nothing if selection is disabled
            if (!this.selectionEnabled) {
                return;
            }

            // Activate selection for seriesId
            if (this.selectedSeriesIds.indexOf(seriesId) === -1) {
                this.selectedSeriesIds.push(seriesId);
            }
            // Deactivate selection for seriesId
            else {
                var index = this.selectedSeriesIds.indexOf(seriesId);
                this.selectedSeriesIds.splice(index, 1);
            }
        };
    }
  
})();