/**
 * @ngdoc directive
 * @name webviewer.directive:wvTimelineControls
 * 
 * @param {osimis.Series} wvSeries The model of the series, as provided by the 
 *                                 `wvSeriesId` directive.
 *                                 
 * @param {boolean} [wvReadonly=false] Deactivate the directive's inputs.
 *
 * @scope
 * @restrict Element
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
            	series: '=wvSeries',
                readonly: '=?wvReadonly'
            },
            templateUrl: 'app/timeline/timeline-controls.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            
        }
    }

    /* @ngInject */
    function Controller() {
        var vm = this;

        // Set default values
        this.readonly = (typeof this.readonly === 'undefined') ? false : this.readonly;

        // Process get/set of image index input (the displayed indexes start
        // from 1 instead of 0).
        this.shownIndex = function(value) {
            if (typeof value !== 'undefined') {
                vm.series.goToImage(value-1);
            }
            else {
                return vm.series.currentIndex + 1
            }
        }
    }
})();