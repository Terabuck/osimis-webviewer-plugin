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
            scope: {

            },
            // replace: true
        };
        return directive;

        function link(scope, element, attrs, layoutCtrl) {
            var vm = scope.vm

            // Set startup values
            vm.asideLeftMinified = layoutCtrl.asideLeftMinified;
            vm.asideLeftHidden = layoutCtrl.asideLeftHidden;
            vm.asideRightMinified = layoutCtrl.asideRightMinified;
            vm.asideRightHidden = layoutCtrl.asideRightHidden;
            vm.asideRightEnabled = layoutCtrl.asideRightEnabled;

            // Listen to value changes
            layoutCtrl.onAsideLeftMinified(vm, function(value) {
                vm.asideLeftMinified = value;
            });
            layoutCtrl.onAsideLeftHidden(vm, function(value) {
                vm.asideLeftHidden = value;
            });
            layoutCtrl.onAsideRightMinified(vm, function(value) {
                vm.asideRightMinified = value;
            });
            layoutCtrl.onAsideRightHidden(vm, function(value) {
                vm.asideRightHidden = value;
            });
            layoutCtrl.onAsideRightEnabled(vm, function(value) {
                vm.asideRightEnabled = value;
            });

            // Close listeners
            scope.$on('$destroy', function() {
                layoutCtrl.onAsideLeftMinified.close(vm);
                layoutCtrl.onAsideLeftHidden.close(vm);
                layoutCtrl.onAsideRightMinified.close(vm);
                layoutCtrl.onAsideRightHidden.close(vm);
                layoutCtrl.onAsideRightEnabled.close(vm);
            });
        }
    }

    /* @ngInject */
    function layoutMainCtrl() {

    }

})();

