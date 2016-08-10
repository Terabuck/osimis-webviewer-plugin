(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvTimelineControls', wvTimelineControls);

    /* @ngInject */
    function wvTimelineControls() {
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