
(function () {
    'use strict';

    angular
        .module('webviewer.layout')
        .directive('wvLayout', wvLayout);

    /* @ngInject */
    function wvLayout() {
        var directive = {
            bindToController: true,
            controller: layoutCtrl,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            transclude: true,
            scope: {},
            templateUrl: 'app/layout/layout.html'
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }

    /* @ngInject */
    function layoutCtrl() {
        var _this = this;

        // Those are defined by wvLayoutMain and called by wvLayoutLeft &
        // wvLayoutRight. 
        // Will be called by wvLayoutLeft/Right as soon as they are
        // initialised (prelink). It wont trigger reflow.
        this.onAsideLeftHidden = new osimis.Listener();
        this.onAsideRightMinified = new osimis.Listener();
        this.onAsideRightHidden = new osimis.Listener();
        this.onAsideRightEnabled = new osimis.Listener();

        // Store the values in case the `wvLayoutMain` directive is loaded
        // after `wvLayoutLeft/Right` directives (and thus not have its 
        // listeners set yet).
        this.asideLeftHidden = undefined;
        this.asideRightMinified = undefined;
        this.asideRightHidden = undefined;
        this.asideRightEnabled = undefined;
        this.onAsideLeftHidden(function(value) {
            _this.asideLeftHidden = value;
        })
        this.onAsideRightMinified(function(value) {
            _this.asideRightMinified = value;
        })
        this.onAsideRightHidden(function(value) {
            _this.asideRightHidden = value;
        })
        this.onAsideRightEnabled(function(value) {
            _this.asideRightEnabled = value;
        })
    }

})();

