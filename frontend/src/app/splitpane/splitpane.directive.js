/**
 * @ngdoc directive
 *
 * @name webviewer.directive:wvSplitpane
 * 
 * @param {object} [wvLayout={x: 1, y:1}]
 *   Define the quantity of row and column:
 *   
 *   * `x` The number of row
 *   * `y` The number of column
 *
 * @scope
 * @restrict Element
 *
 * @description
 * The `wvSplitpane` directive provides multiple pane organized on a grid.
 * The pane quantity depends on its configuration. Panes must be configured
 * using the `wvPanePolicy` directive. See the example.
 * It triggers $(window).resize() on layout change.
 * For additional configuration option, see the specific `wvPanePolicy` source code.
 *
 * @example
 * ```html
 * <wv-splitpane wv-layout="{x: 2, y: 2}">
 *     <wv-pane-policy>
 *         This will be repeated 4 times.
 *     </wv-pane-policy>
 * </wv-splitpane>
 * ```
 **/
 (function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSplitpane', wvSplitpane);

    /* @ngInject */
    function wvSplitpane() {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                layout: '=?wvLayout'
            },
            templateUrl: 'app/splitpane/splitpane.directive.html',
            transclude: {
                panePolicy: 'wvPanePolicy'
            }
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }

    /* @ngInject */
    function Controller($scope, wvPaneManager) {
        var vm = this;

        /* jshint -W116 */
        vm.layout = vm.layout || {
            x: 1,
            y: 1
        };
        /* jshint +W116 */

        // Trigger $(window).resize() on layout change & set row & columns width
        $scope.$watch('vm.layout', _updateLayout, true);
        function _updateLayout(newLayout) {
            if (!newLayout) return;

            vm.rowHeight = 100 / newLayout.y + '%';
            vm.rowWidth = 100 / newLayout.x + '%';

            // Trigger window resizes (so javascript canvas can be resized
            // adequately). We do this after the digest cycle but prior to
            // the reflow, using asap.
            asap(function() {
                $(window).trigger('resize');
            });
        }

        this.paneManager = wvPaneManager;
    }
})();
