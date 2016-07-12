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
            transclude: true,
            require: {
                series: '?^^wvSerieId',
                droppableSerieExt: '?^^wvDroppableSerieExt'
            },
            templateUrl: 'app/overlay/droppable-series-overlay-item.directive.html',
            scope: {} // isolated scope is required to avoid scope.vm override
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;

            if (!ctrls.series || !ctrls.droppableSeriesExt) {
                // don't show notice has the viewport is not droppable
                scope.show = false;
            }
            else {
                scope.show = !ctrls.series.hasSeries();
                ctrls.series.onSeriesChanged(_this, function (series) {
                    scope.show = !ctrls.series.hasSeries();
                });

                scope.$on('$destroy', function() {
                    ctrls.series.onSerieChanged.close(_this);
                });
            }
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();