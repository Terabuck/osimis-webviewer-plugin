(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvPanePolicy', wvPanePolicy);

    /* @ngInject */
    function wvPanePolicy() {
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
                paneIndex: '=?wvPaneIndex',
                panePosition: '=?wvPanePosition',
                onAdded: '&?wvOnPaneAdded', // called once by pane added
                onRemoved: '&?wvOnPaneRemoved' // called once by pane removed
            },
            transclude: true,
            template: '<div ng-transclude></div>'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
            
            // Avoid strange AngularJS dual initialisation (may be due
            // to the use of transcluded slot of the same name of this
            // directive)
            if (element.parent().prop('tagName') === 'NG-TRANSCLUDE') {
                scope.$destroy();
                return;
            }
            
            // Retrieve the splitpane ng-repeat context scope to access the position of the pane within the splitpane
            //
            // Using $parent is the simplest way to retrieve the ng-repeat context scope from wvSplitpane
            // The first $parent is used to get out of wvPanePolicy directive isolate scope
            // The second $parent is used to get out of wvPanePolicy transclusion scope
            // It won't ever cause any issues in this case, especially because the wvPanePolicy directive is also
            // a transclusion slot of wvSplitpane (its position in the dom will therefore always be the same),
            // and because the wvSplitpane and wvPanePolicy directives are interdependent.
            //
            // The other way arounds to avoid using $parent are:
            // 1. make wvPanePolicy act as ng-repeat and share the desired context scope to
            //    wvSplitpane through inter-directive communication using `require`.
            // 2. override the standad Transclusion scope behavior using a transclusion function in wvSplitpane
            //    and don't use an isolate scope for the wvPanePolicy directive.
            var contextScope = scope.$parent.$parent;
            
            // Configure paneIndex and panePosition
            vm.paneIndex = contextScope.$index;
            vm.panePosition = vm.panePosition || {
                x: contextScope.$x,
                y: contextScope.$y
            };

            // Set wvPanePolicy directive attributes based on $index, $x and $y from wvSplitpane context
            var $x = contextScope.$x;
            var $y = contextScope.$y;
            vm.panePosition.x = $x;
            vm.panePosition.x = $x;

            var layout = contextScope.wvLayout;
            vm.paneIndex = ($y*layout.x) + ($x);
            
            // Call onAdded and onRemoved callbacks
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