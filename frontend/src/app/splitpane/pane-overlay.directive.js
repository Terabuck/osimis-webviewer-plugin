(function() {
    'use strict';
    
    /** <wv-pane-overlay><wv-pane-overlay/>
     *
     * Shows a notice if the overlay can be dropped.
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
            templateUrl: 'app/splitpane/pane-overlay.directive.html',
            scope: {
                pane: 'wvPane'
            }
        };
        return directive;

        function link(scope, element, attrs) {
            var _this = this;
        }
    }

    /* @ngInject */
    function Controller() {
        this.pane = undefined;
    }
})();