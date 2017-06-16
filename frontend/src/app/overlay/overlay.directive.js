/**
 * @ngdoc directive
 * @name webviewer.directive:wvOverlay
 * 
 * @restrict Element
 * @requires webviewer.directive:wvViewport
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvOverlay', wvOverlay);

    /* @ngInject */
    function wvOverlay(wvStudyManager) {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            replace: true, // avoid overlay capturing viewport events
            link: link,
            restrict: 'E',
            transclude: true,
            require: {
                series: '?^^vpSeriesId'
            },
            templateUrl: 'app/overlay/overlay.directive.html',
            scope: {
                'wvTags': '=?',
            	'wvSeries': '=?',
                'studyId': '=?wvStudyId',
            	'wvViewport': '=?',
            	'wvShowTimeline': '=?'
            }
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;
            var vm = scope.vm;

            vm.showTopLeftArea = function() {
                return !!vm.wvTags;
            };
            vm.showTopRightArea = function() {
                return !!vm.wvTags &&
                    !!vm.wvTags.SeriesDescription &&
                    !!vm.wvTags.SeriesNumber;
            };
            vm.showBottomRightArea = function() {
                return !!vm.wvViewport && !!vm.wvTags;
            };
            vm.wvShowTimeline = typeof vm.wvShowTimeline === 'undefined' ? true : vm.wvShowTimeline;
            vm.showTimeline = false;

            // auto grab series model
            if (vm.wvShowTimeline && ctrls.series) {
                var series = ctrls.series.getSeries();
                vm.wvSeries = series;
                vm.showTimeline = series && vm.wvShowTimeline && !!series.imageCount;

                ctrls.series.onSeriesChanged(_this, function(series) {
                    vm.wvSeries = series;
                    vm.showTimeline = vm.wvShowTimeline && series && series.imageCount > 1;
                });
                scope.$on('$destroy', function() {
                    ctrls.series.onSeriesChanged.close(_this);
                });
            }

            // Update study model.
            vm.study = undefined;
            scope.$watch('vm.studyId', function(studyId) {
                // Clear study if studyId is removed.
                if (!studyId) {
                    vm.study = undefined;
                    return;
                }

                // Load new study.
                wvStudyManager
                    .get(studyId)
                    .then(function(study) {
                        vm.study = study;
                    });
            });

            // function _onViewportData(viewport) {
            //     scope.$viewport = viewport;

            //     if (!viewport) {
            //       scope.showBottomRightArea = false;
            //     }
            //     else {
            //       scope.$viewport.scale = parseFloat(viewport.scale).toFixed(2);
            //       scope.$viewport.voi.windowWidth = parseFloat(viewport.voi.windowWidth).toFixed(0);
            //       scope.$viewport.voi.windowCenter = parseFloat(viewport.voi.windowCenter).toFixed(0);
            //       scope.showBottomRightArea = true;
            //     }
            // }
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();