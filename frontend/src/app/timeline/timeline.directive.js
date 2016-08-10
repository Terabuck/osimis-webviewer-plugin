(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvTimeline', wvTimeline);

    /* @ngInject */
    function wvTimeline() {
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
            templateUrl: 'app/timeline/timeline.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();