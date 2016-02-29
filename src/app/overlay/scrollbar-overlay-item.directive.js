(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvScrollbarOverlayItem', wvScrollbarOverlayItem);

    /* @ngInject */
    function wvScrollbarOverlayItem() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            templateUrl: 'app/overlay/scrollbar-overlay-item.directive.tpl.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
            	wvImageCount: '=',
            	wvImageIndex: '='
            }
        };
        return directive;

        function link(scope, element, attrs) {
            scope.vm.scrollbarDistanceFromRight = '0%';

            scope.$watchGroup(['vm.wvImageIndex', 'vm.wvImageCount'], _setScrollbarDimension);
            
            function _setScrollbarDimension() {
              requestAnimationFrame(function() {
                // if (!scope.vm.wvImageIndex || typeof scope.vm.wvImageCount === 'undefined') return;

                var eq = Math.ceil(100 * (scope.vm.wvImageIndex+1) / scope.vm.wvImageCount);
                scope.vm.scrollbarDistanceFromRight = 100 - eq + '%';
                scope.$digest();
              });
            }
        }
    }

    /* @ngInject */
    function Controller() {

    }
    
})();