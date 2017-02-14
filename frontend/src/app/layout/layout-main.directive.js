(function () {
    'use strict';

    angular
        .module('webviewer.layout')
        .directive('wvLayoutMain', wvLayoutMain);

    /* @ngInject */
    function wvLayoutMain() {
        var directive = {
            bindToController: true,
            require: '^^wvLayout',
            controller: layoutMainCtrl,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            transclude: true,
            templateUrl: 'app/layout/layout-main.html',
            scope: {}
        };
        return directive;

        function link(scope, element, attrs, wvLayout) {
            var vm = scope.vm

            // Sync main section position with other sections
            vm.isTopPaddingEnabled = wvLayout.isTopEnabled;
            vm.isRightPaddingEnabled = wvLayout.isRightEnabled && !wvLayout.isRightClosed;
            vm.isBottomPaddingEnabled = wvLayout.isBottomEnabled;
            vm.isLeftPaddingEnabled = wvLayout.isLeftEnabled && !wvLayout.isLeftClosed;

            scope.$watch(function() {
                return [
                    wvLayout.isTopEnabled,
                    wvLayout.isRightEnabled,
                    wvLayout.isRightClosed,
                    wvLayout.isBottomEnabled,
                    wvLayout.isLeftEnabled,
                    wvLayout.isLeftClosed,
                ];
            }, function(newValues) {
                vm.isTopPaddingEnabled = newValues[0];
                vm.isRightPaddingEnabled = newValues[1] && !newValues[2];
                vm.isBottomPaddingEnabled = newValues[3];
                vm.isLeftPaddingEnabled = newValues[4] && !newValues[5];
            }, true);
        }
    }

    /* @ngInject */
    function layoutMainCtrl() {

    }

})();

