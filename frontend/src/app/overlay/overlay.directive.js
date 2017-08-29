/**
 * @ngdoc directive
 * @name webviewer.directive:wvOverlay
 * 
 * @restrict Element
 * @requires webviewer.directive:wvViewport
 *
 * @param {boolean} [wvKeyImageCaptureEnabled=false]
 * When activated, this option displays a button on each viewport. When the button is
 * clicked, a new DICOM series is created with the image of the viewport, including the
 * annotations. This image is considered as a DICOM Key Image Note (see 
 * `http://wiki.ihe.net/index.php/Key_Image_Note`).
 *
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
                wvTags: '=?',
                wvSeries: '=?',
                studyId: '=?wvStudyId',
                wvViewport: '=?',
                image: '=wvImage',
                keyImageCaptureEnabled: '=?wvKeyImageCaptureEnabled',
            }
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;
            var vm = scope.vm;

            // Set default value.
            vm.keyImageCaptureEnabled = typeof vm.keyImageCaptureEnabled !== 'undefined' ? vm.keyImageCaptureEnabled : false;


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

            // auto grab series model
            if (ctrls.series) {
                var series = ctrls.series.getSeries();
                vm.wvSeries = series;

                ctrls.series.onSeriesChanged(_this, function(series) {
                    vm.wvSeries = series;
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

        }
    }

    /* @ngInject */
    function Controller() {

    }
})();