(function () {
    'use strict';

    angular
        .module('webviewer.layout')
        .directive('wvLayoutTop', wvLayoutTop);

    /* @ngInject */
    function wvLayoutTop() {
        var directive = {
            // bindToController: true,
            require: '^^wvLayout',
            transclude: {
                '1': '?wvLayoutTop1',
                '2': '?wvLayoutTop2',
                '3': '?wvLayoutTop3',
                '4': '?wvLayoutTop4'
            },
            controller: layoutTopCtrl,
            // controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: false,
            templateUrl: 'app/layout/layout-top.html'
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }

    /* @ngInject */
    function layoutTopCtrl() {
        var vm = this;
    }

})();

