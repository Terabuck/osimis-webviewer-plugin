/**
 * @ngdoc directive
 *
 * @name webviewer.directive:wvPanePolicy
 * 
 * @param {integer} [wvPaneIndex] (readonly) 
 * Provide the index of the pane
 * 
 * @param {object} [wvPanePosition] (readonly)
 * Provide the position of the pane within the splitpane
 * 
 * * `x` The column index - starts from 0
 * * `y` The row index - starts from 0
 *
 * @param {osimis.Pane} [wvPane] (readonly)
 * The pane object.
 * 
 * @param {callback} [wvOnPaneAdded] 
 * Called when the pane is added.
 * Useful to provide external configuration. For instance, save and retrieve the pane
 * state on a database.
 * 
 * Callback attributes arguments:
 * 
 * * `$index` - provide wvPaneIndex like data
 * * `$position` - provide wvPanePosition like parameter
 * 
 * @param {callback} [wvOnPaneRemoved]
 * Called when the pane is removed
 * Useful to provide external cleanup.
 * 
 * Callback attributes arguments:
 * 
 * * `$index` - provide `wvPaneIndex` like data
 * * `$position` - provide `wvPanePosition` like parameter
 *
 * @requires webviewer.directive:wvSplitpane
 * @restrict Element
 * @scope
 * 
 * @description
 * The `wvPanePolicy` directive configure the content of the `wvSplitpane` directive.
 * It provides standard access to the user scope. Pane properties can be retrieved
 * via additional attributes.
 * 
 * @example
 * The following example display a 2x2 layout of viewports. The series ids are stored on an array.
 * The pane is bound to a context external of the splitpane one, via vm.viewports array,
 * configure & cleanup methods. The external context is accessed via the pane-policy using
 * the `wvPaneIndex` attribute via vm.viewports[$index].
 * 
 * ```js
 * // Configure viewports by index
 * var defaultSeriesId = 'your-series';
 * vm.viewports = [];
 * vm.configureViewport = function(index) {
 *     vm.viewports[index] = {
 *         seriesId: defaultSeriesId
 *     };
 * };
 * vm.cleanupViewport = function(index) {
 *     vm.viewports[index] = undefined; // don't use splice since it changes the indexes from the array
 * }; 
 * ```
 * 
 * ```html
 * <wv-splitpane wv-layout="{x: 2, y: 2}">
 *     <wv-pane-policy wv-pane-index="$index" wv-pane-position="$position"
 *         wv-on-pane-added="vm.configureViewport($index)"
 *         wv-on-pane-removed="vm.cleanupViewport($index)"
 *         wv-size-tag
 *     >
 *         <wv-viewport vp:series-id="vm.viewports[$index].seriesId"
 *                      wv-size="{width: '[wv-size-tag]', height: '[wv-size-tag]'}"
 *         ></wv-viewport>
 *     </wv-pane-policy>
 * </wv-splitpane>
 * ```
 **/
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvPanePolicy', wvPanePolicy);

    /* @ngInject */
    function wvPanePolicy(wvPaneManager) {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            require: {
                splitpane: '^^wvSplitpane'
            },
            scope: {
                pane: '=?wvPane',
                paneIndex: '=?wvPaneIndex',
                panePosition: '=?wvPanePosition',
                onAdded: '&?wvOnPaneAdded', // called once by pane added
                onRemoved: '&?wvOnPaneRemoved' // called once by pane removed
            },
            transclude: true,
            templateUrl: 'app/splitpane/pane-policy.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
            
            // Retrieve the splitpane ng-repeat context scope to access the
            // position of the pane within the splitpane.
            //
            // Using $parent is the simplest way to retrieve the ng-repeat
            // context scope from wvSplitpane The first $parent is used to get
            // out of wvPanePolicy directive isolate scope The second $parent
            // is used to get out of wvPanePolicy transclusion scope It won't
            // ever cause any issues in this case, especially because the
            // wvPanePolicy directive is also a transclusion slot of
            // wvSplitpane (its position in the dom will therefore always be
            // the same), and because the wvSplitpane and wvPanePolicy
            // directives are interdependent.
            //
            // The other way arounds to avoid using $parent are:
            // 1. make wvPanePolicy act as ng-repeat and share the desired
            //    context scope to wvSplitpane through inter-directive
            //    communication using `require`.
            // 2. override the standard transclusion scope behavior using a
            //    transclusion function in wvSplitpane and don't use an isolate
            //    scope for the wvPanePolicy directive.
            var contextScope = scope.$parent.$parent;
            
            // Configure paneIndex and panePosition

            // Set wvPanePolicy directive attributes based on $index, $x and $y
            // from wvSplitpane context.
            var $x = contextScope.$x;
            var $y = contextScope.$y;
            
            vm.paneIndex = ($y*wvPaneManager.layout.x) + ($x);
            vm.panePosition = {
                x: $x,
                y: $y
            };

            vm.pane = wvPaneManager.getPane($x, $y);

            // Call `onAdded` and `onRemoved` callbacks.
            if (vm.onAdded) {
                vm.onAdded({
                    $index: vm.paneIndex,
                    $position: vm.panePosition
                });
            }
            scope.$on('$destroy', function() {
                if(vm.onRemoved) {
                    vm.onRemoved({
                        $index: vm.paneIndex,
                        $position: vm.panePosition
                    });
                }
            });
        }
    }

    /* @ngInject */
    function Controller() {
    }
})();