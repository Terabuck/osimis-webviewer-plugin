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
            scope: {
                // In the current state, hidden ~= enabled for aside right 
                // because there is no hidden state, but enabled hides the
                // element + the controls button. @todo refactor 
                // @warning readonly property!
                asideRightClosed: '=?wvAsideRightClosed',
                asideLeftHidden: '=?wvAsideLeftClosed'
            },
            templateUrl: 'app/layout/layout.html'
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }

    /* @ngInject */
    function layoutCtrl($scope) {
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
        this.asideRightClosed = _this.asideRightHidden || !_this.asideRightEnabled;
        this.onAsideLeftHidden(function(value) {
            _this.asideLeftHidden = value;
        });
        this.onAsideRightMinified(function(value) {
            _this.asideRightMinified = value;
        });
        this.onAsideRightHidden(function(value) {
            // Set aside right hidden to true by default
            if (typeof value === 'undefined') {
                value = true;
            }

            _this.asideRightHidden = value;
            _this.asideRightClosed = _this.asideRightHidden || !_this.asideRightEnabled;
        });
        this.onAsideRightEnabled(function(value) {
            _this.asideRightEnabled = value;
            _this.asideRightClosed = _this.asideRightHidden || !_this.asideRightEnabled;
        });

        // Trigger window resizes (so javascript canvas can be resized
        // adequately). We do this after the digest cycle but prior to
        // the reflow, using asap.
        // asap(function() {
        $scope.$watchGroup([
            'vm.asideRightClosed',
            'vm.asideLeftHidden'
        ], function() {
            // Go to the end of the digest cycle, when
            // Right aside css class has been set
            // Left aside css class has been set
            // We use two setTimeout, because just using $evalAsync provides
            // random results.
            // @warning random ui bug
            // The only way to fix I know this is to manage the reflow logic at 
            // an upper level, and thus centralize the UI resizing 
            // responsabilities from layout, splitpane and viewport in a single
            // source code.
            // This can be organically/easily done by stopping relying on
            // window resize events but only rely on angularjs $digest process
            // by setting the concrete viewports canvas size in an attribute
            // although it requires calculating it before without triggering
            // reflows (thus without relying on DOM methods to retrieve the
            // size).
            $scope.$evalAsync(function() {
                setTimeout(function() {
                    $scope.$apply(function() {
                        asap(function() {
                            $(window).trigger('resize');
                        });
                    });
                }, 50);
            });
        });
    }

})();