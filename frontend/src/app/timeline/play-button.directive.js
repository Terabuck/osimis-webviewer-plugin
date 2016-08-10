(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvPlayButton', wvPlayButton);

    /* @ngInject */
    function wvPlayButton() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                series: '=wvSeries'
            },
            templateUrl: '/app/timeline/play-button.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();