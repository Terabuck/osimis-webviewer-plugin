(function() {
    'use strict';
    
    /** <wvDroppableSerieOverlayItem><wvDroppableSerieOverlayItem/>
     *
     * Shows a notice if the overlay can be dropped.
     * Only show the notice when ^^wvDroppableSerieExt is present
     */
    angular
        .module('webviewer')
        .directive('wvDroppableSerieOverlayItem', wvDroppableSerieOverlayItem);

    /* @ngInject */
    function wvDroppableSerieOverlayItem() {
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
                serie: '?^^wvSerieId',
                droppableSerieExt: '?^^wvDroppableSerieExt'
            },
            templateUrl: 'app/overlay/droppable-serie-overlay-item.directive.html',
            scope: {} // isolated scope is required to avoid scope.vm override
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;

            if (!ctrls.serie || !ctrls.droppableSerieExt) {
                // don't show notice has the viewport is not droppable
                scope.show = false;
            }
            else {
                scope.show = !ctrls.serie.hasSerie();
                ctrls.serie.onSerieChanged(_this, function (serie) {
                    scope.show = !ctrls.serie.hasSerie();
                });

                scope.$on('$destroy', function() {
                    ctrls.serie.onSerieChanged.close(_this);
                });
            }
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();