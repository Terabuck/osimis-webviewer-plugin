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
            templateUrl: 'app/overlay/scrollbar-overlay-item.directive.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
            	wvImageCount: '=',
            	wvShownImageIndex: '=',
            	wvImageIndex: '='
            }
        };
        return directive;

        function link(scope, element, attrs) {
            scope.vm.loadedScrollbarDistanceFromRight = '0%';
            scope.vm.loadingScrollbarDistanceFromRight = '0%';

            scope.$watchGroup(['vm.wvShownImageIndex', 'vm.wvImageCount'], _setLoadedScrollbarDimension);
            scope.$watchGroup(['vm.wvImageIndex', 'vm.wvImageCount'], _setLoadingScrollbarDimension);
            
            function _setLoadedScrollbarDimension() {
                var eq = Math.ceil(100 * (scope.vm.wvShownImageIndex+1) / scope.vm.wvImageCount);
                scope.vm.loadedScrollbarDistanceFromRight = 100 - eq + '%';
            }

            function _setLoadingScrollbarDimension() {
                var eq = Math.ceil(100 * (scope.vm.wvImageIndex+1) / scope.vm.wvImageCount);
                scope.vm.loadingScrollbarDistanceFromRight = 100 - eq + '%';
            }
        }
    }

    /* @ngInject */
    function Controller() {

    }
    
})();