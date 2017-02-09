(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvNotice', wvNotice);

    /* @ngInject */
    function wvNotice() {
        var directive = {
            bindToController: true,
            controller: NoticeVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                content: '=?wvContent',
                onClosed: '&?wvOnClose'
            },
            templateUrl: 'app/utilities/notice.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function NoticeVM() {
        // Trigger onClose callback when close button is clicked on
        this.close = function() {
            this.onClosed();
        };
    }
})();