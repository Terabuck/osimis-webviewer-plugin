(function() {
    'use strict';
    
    /** <wvDroppableSeriesOverlayItem><wvDroppableSeriesOverlayItem/>
     *
     * Shows a notice if the overlay can be dropped.
     * Only show the notice when ^^wvDroppableSerieExt is present
     */
    angular
        .module('webviewer')
        .directive('wvDroppableSeriesOverlayItem', wvDroppableSeriesOverlayItem);

    /* @ngInject */
    function wvDroppableSeriesOverlayItem() {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            transclude: true,
            templateUrl: 'app/overlay/droppable-series-overlay-item.directive.html',
            scope: {} // isolated scope is required to avoid scope.vm override
        };
        return directive;

        function link(scope, element, attrs) {
            var _this = this;
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();