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

    var ArrayHelpers = {
       pushIfDefined: function(array, value) {
            if (value !== undefined) {
                array.push(value);
            }
       },
       pushIfDefinedWithPrefix: function(array, prefix, value) {
            if (value !== undefined) {
                array.push(prefix + value);
            }
        }
     };

    /* @ngInject */
    function wvOverlay(wvStudyManager, wvInstanceManager) {
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
                return (!!vm.topLeftLines && vm.topLeftLines.length > 0) || vm.topLeftIcon;
            };
            vm.showTopRightArea = function() {
                return (!!vm.topRightLines && vm.topRightLines.length > 0) || vm.topRightIcon;
            };
            vm.showBottomRightArea = function() { // this is a mix of viewport information (check in the html code + custom layout defined in this code)
                return (!!vm.wvViewport || (!!vm.bottomRightLines && vm.bottomRightLines.length > 0)) || vm.bottomRightIcon;
            };
            vm.showBottomLeftArea = function() {
                return (!!vm.bottomLeftLines && vm.bottomLeftLines.length > 0) || vm.bottomLeftIcon;
            };

            vm.getTopLeftArea = function(seriesTags, instanceTags) {
                var lines = [];

                ArrayHelpers.pushIfDefined(lines, seriesTags.PatientName);
                ArrayHelpers.pushIfDefined(lines, seriesTags.PatientID);
                ArrayHelpers.pushIfDefined(lines, seriesTags.OsimisNote);

                return lines;
            };
            vm.getTopRightArea = function(seriesTags, instanceTags) {
                var lines = [];

                ArrayHelpers.pushIfDefined(lines, seriesTags.StudyDescription);
                ArrayHelpers.pushIfDefined(lines, seriesTags.StudyDate);

                var lineElements = [];
                ArrayHelpers.pushIfDefinedWithPrefix(lineElements, "#", seriesTags.SeriesNumber);
                ArrayHelpers.pushIfDefined(lineElements, seriesTags.SeriesDescription);
                if (lineElements.length > 0) {
                    lines.push(lineElements.join(" - "));
                }

                return lines;
            };
            vm.getBottomLeftArea = function(seriesTags, instanceTags) { // this has been added for Avignon, it still needs to be checked with nico how it should be done for good
                var lines = [];

                ArrayHelpers.pushIfDefined(lines, instanceTags.PatientOrientation);
                ArrayHelpers.pushIfDefined(lines, instanceTags.ImageLaterality);
                ArrayHelpers.pushIfDefined(lines, instanceTags.ViewPosition);

                return lines;
            };
            vm.getBottomRightArea = function(seriesTags, instanceTags) {
                return [];
            };
            vm.updateIcons = function(overlayIconsInfo) {
                if (overlayIconsInfo === undefined) {
                    vm.topLeftIcon = undefined;
                    vm.bottomLeftIcon = undefined;
                    vm.topRightIcon = undefined;
                    vm.bottomRightIcon = undefined;
                } else {
                    vm.topLeftIcon = overlayIconsInfo.topLeftIcon;
                    vm.bottomLeftIcon = overlayIconsInfo.bottomLeftIcon;
                    vm.topRightIcon = overlayIconsInfo.topRightIcon;
                    vm.bottomRightIcon = overlayIconsInfo.bottomRightIcon;
                }
            };
            vm.updateLayout = function(seriesTags, imageId, customOverlayInfo) {
                if (imageId) {
                    wvInstanceManager
                        .getTags(imageId.split(":")[0]) // imageId is something like orthancId:frameId
                        .then(function(instanceTags) {
                            vm.topLeftLines = vm.getTopLeftArea(seriesTags, instanceTags);
                            vm.topRightLines = vm.getTopRightArea(seriesTags, instanceTags);
                            vm.bottomLeftLines = vm.getBottomLeftArea(seriesTags, instanceTags);
                            vm.bottomRightLines = vm.getBottomRightArea(seriesTags, instanceTags);
                            vm.showOverlay = true;
                            if (customOverlayInfo !== undefined) {
                                vm.updateIcons(customOverlayInfo.icons);
                            } else {
                                vm.updateIcons(undefined);
                            }
                        });
                } else {
                    vm.topLeftLines = [];
                    vm.topRightLines = [];
                    vm.bottomLeftLines = [];
                    vm.bottomRightLines = [];
                    vm.showOverlay = false;
                    vm.updateIcons(undefined);
                }
            };

            // auto grab series model
            if (ctrls.series) {
                var series = ctrls.series.getSeriesPromise().then(function(series) {
                    vm.wvSeries = series;
                    vm.updateLayout(vm.wvSeries.tags, vm.wvSeries.imageIds[vm.wvSeries.currentShownIndex], vm.wvSeries.customOverlayInfo);

                    ctrls.series.onSeriesChanged(_this, function(series) {
                        vm.wvSeries = series;
                        vm.updateLayout(vm.wvSeries.tags, vm.wvSeries.imageIds[vm.wvSeries.currentShownIndex], vm.wvSeries.customOverlayInfo);
                    });
                    ctrls.series.onCurrentImageIdChanged(_this, function(imageId, notUsed) {
                        vm.updateLayout(vm.wvSeries.tags, imageId, vm.wvSeries.customOverlayInfo);
                    });

                    scope.$on('$destroy', function() {
                        ctrls.series.onSeriesChanged.close(_this);
                        ctrls.series.onCurrentImageIdChanged.close(_this);
                    });
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