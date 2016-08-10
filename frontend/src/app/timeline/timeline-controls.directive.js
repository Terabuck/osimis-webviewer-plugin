/**
 * @ngdoc directive
 * @name wvTimelineControls
 *
 * @description
 * The `wvTimelineControls` directive displays the following four controls:
 *   * The previous and next buttons allow the user to switch image by image.
 *   * An input field let the user specify the image index directly.
 *   * A play button let the user play the series and configure a specific framerate.
 *
 * If the series only has one single image, the previous/next and play buttons are hidden, but the input field
 * is still shown.
 *
 * This directive is used by the `wvTimeline` directive.
 *
 * @scope
 *
 * @restrict E
 *
 * @param {series_model} wvSeries (required) The model of the series, as provided by the `wvSeriesId` directive.
 **/
 (function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvTimelineControls', wvTimelineControls);

    /* @ngInject */
    function wvTimelineControls() {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
            	series: '=wvSeries'
            },
            templateUrl: 'app/timeline/timeline-controls.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            vm.shownIndex = function(value) {
                if (typeof value !== 'undefined') {
                    vm.series.goToImage(value-1);
                }
                else {
                    return vm.series.currentIndex + 1
                }
            }
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();