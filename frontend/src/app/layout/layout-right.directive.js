(function () {
    'use strict';

    angular
        .module('webviewer.layout')
        .directive('wvLayoutRight', wvLayoutRight);

    /* @ngInject */
    function wvLayoutRight($timeout) {
        var directive = {
            bindToController: true,
            controller: layoutRightCtrl,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            require: '^^wvLayout',
            transclude: true,
            scope: {
                // asideMinified: '=?wvAsideMinified', - For now, panel will always be minified (as required by Liveshare UI)
                asideHidden: '=?wvAsideHidden',
                asideEnabled: '=?wvAsideEnabled'
            },
            templateUrl:'app/layout/layout-right.html'
        };
        return directive;

        function link(scope, element, attrs, layoutCtrl) {
            var vm = scope.vm;

            // Set initial values
            vm.asideMinified = true; // for now, panel will always be minified (as required by Liveshare UI)
            vm.asideHidden = !!vm.asideHidden;
            vm.asideEnabled = !!vm.asideEnabled;

            // Propagate to `main` layout section
            layoutCtrl.onAsideRightMinified.trigger(vm.asideMinified);
            layoutCtrl.onAsideRightHidden.trigger(vm.asideHidden);
            layoutCtrl.onAsideRightEnabled.trigger(vm.asideEnabled);

            // Use $watchGroup to avoid dual/trial triggering on change.
            scope.$watchGroup([
                'vm.asideMinified', // @deprecated
                'vm.asideHidden',
                'vm.asideEnabled'
            ], function (newValues, oldValues) {
                // Ignore the first setting (at application startup)
                if (newValues[0] === oldValues[0] && newValues[1] === oldValues[1] && newValues[2] === oldValues[2]) {
                    return;
                }

                // Trigger `minified` changed event (so the main section can changes its size via css)
                if (newValues[0] !== oldValues[0] && layoutCtrl.onAsideRightMinified) {
                    layoutCtrl.onAsideRightMinified.trigger(newValues[0]);
                }

                // Trigger `hidden` changed event (so the main section can changes its size via css)
                if (newValues[1] !== oldValues[1] && layoutCtrl.onAsideRightHidden) {
                    layoutCtrl.onAsideRightHidden.trigger(newValues[1]);
                }

                // Trigger `enabled` changed event (so the main section can changes its size via css)
                if (newValues[2] !== oldValues[2] && layoutCtrl.onAsideRightEnabled) {
                    layoutCtrl.onAsideRightEnabled.trigger(newValues[2]);
                }

                // trigger window resizes (so javascript canvas can be resized adequately)
                _triggerResize();
            });

            function _triggerResize() {
                var start = undefined;
                var animationDuration = 700; // ms

                requestAnimationFrame(function _triggerResizeAccumulator(timestamp) { // timestamp unit is millisecond (double) 
                    if (!start) {
                        start = timestamp;
                    }
                    var progress = timestamp - start;

                    // Animate progressively
                    if (progress < animationDuration) {
                        // Resize viewports aso.
                        $(window).trigger('resize');

                        // Loop
                        requestAnimationFrame(_triggerResizeAccumulator);
                    }
                });
            }
        }
    }

    /* @ngInject */
    function layoutRightCtrl() {
        
    }

})();

