/**
 * @ngdoc directive
 * @name wvPlayButton
 *
 * @description
 * The `wvPlayButton` directive displays a play control and a configuration panel.
 * Framerate is controlled via the configuration panel.
 *
 * This directive is used by the `wvTimelineControls` directive.
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
        .directive('wvPlayButton', wvPlayButton);

    /* @ngInject */
    function wvPlayButton() {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                series: '=wvSeries'
            },
            templateUrl: 'app/timeline/play-button.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();