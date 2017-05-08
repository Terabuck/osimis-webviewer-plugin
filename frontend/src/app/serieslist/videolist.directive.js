/**
 * @ngdoc directive
 * @name webviewer.directive:wvVideolist
 * 
 * @restrict Element
 *
 * @scope
 *
 * @param {string} studyId
 * The id of the study.
 * 
 * @param {callback} onStudyLoaded
 * Callback mainly used for unit test.
 *
 * @param {boolean} [wvSelectionEnabled=false]
 * Let the end-user select series in the serieslist using a single click. This
 * selection has no impact on the standalone viewer. However, host applications
 * can retrieve the selection to do customized actions using the
 * `wvSelectedVideoIds` parameter.
 *
 * @param {Array<string>} [wvSelectedVideoIds=EmptyArray]
 * When `wvSelectionEnabled` is set to true, this parameter provide the list of
 * selected series as orthanc ids. This list can be retrieved to customize the
 * viewer by host applications.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvVideolist', wvVideolist);

    /* @ngInject */
    function wvVideolist($q, wvSeriesManager, wvVideoManager) {
        var directive = {
            bindToController: true,
            controller: VideolistVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                studyId: '=wvStudyId',
                onStudyLoaded: '&?wvOnStudyLoaded', // For testing convenience

                // Selection-related
                selectionEnabled: '=?wvSelectionEnabled',
                selectedVideoIds: '=?wvSelectedVideoIds'
            },
            templateUrl: 'app/serieslist/videolist.directive.html'
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
                vm.selectedVideoIds = [];
                vm.loaded = false;

                wvSeriesManager
                    .listFromOrthancStudyId(id)
                    .then(function(seriesList) {
                        // Set image series ids.
                        // Update video & pdf instance ids (once the series 
                        // have been loaded since the series manager request 
                        // will load the pdf instances too in one single HTTP
                        // request).
                        return $q.all({
                            videos: $q.all(wvVideoManager.listInstanceIdsFromOrthancStudyId(id)),
                        });
                    })
                    .then(function(data) {
                        var videos = data.videos;
                        
                        // Set video models.
                        vm.videos = videos;
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
    function VideolistVM() {
        // Set initial values.
        this.videos = [];
        this.selectionEnabled = typeof this.selectionEnabled === 'undefined' ? false : this.selectionEnabled;
        this.selectedVideoIds = this.selectedVideoIds || [];

        this.toggleSelection = function(seriesId) {
            // Do nothing if selection is disabled
            if (!this.selectionEnabled) {
                return;
            }

            // Activate selection for seriesId
            if (this.selectedVideoIds.indexOf(seriesId) === -1) {
                this.selectedVideoIds.push(seriesId);
            }
            // Deactivate selection for seriesId
            else {
                var index = this.selectedVideoIds.indexOf(seriesId);
                this.selectedVideoIds.splice(index, 1);
            }
        };
    }
  
})();