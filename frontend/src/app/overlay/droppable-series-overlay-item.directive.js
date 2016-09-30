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
                series: '?^^vpSeriesId',
                droppableSeriesExt: '?^^wvDroppableSeriesExt'
            },
            templateUrl: 'app/overlay/droppable-series-overlay-item.directive.html',
            scope: {} // isolated scope is required to avoid scope.vm override
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;

            if (!ctrls.series || !ctrls.droppableSeriesExt) {
                // don't show notice because the viewport is not droppable
                scope.vm.show = false;
            }
            else {
                scope.vm.show = !ctrls.series.hasSeries();
                ctrls.series.onSeriesChanged(_this, function (series) {
                    scope.vm.show = !ctrls.series.hasSeries();
                });

                scope.$on('$destroy', function() {
                    ctrls.series.onSeriesChanged.close(_this);
                });
            }
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();