(function() {
    'use strict';

    angular
        .module('webviewer.serieslist')
        .directive('wvAdvancedSerielist', wvAdvancedSerielist);

    /* @ngInject */
    function wvAdvancedSerielist() {
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
            scope: {
            	studyId: '=wvStudyId',
                minified: '=wvMinified'
            },
            templateUrl: 'app/advanced-serielist/advanced-serielist.tpl.html'
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();