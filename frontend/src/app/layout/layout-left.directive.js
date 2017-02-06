(function () {
    'use strict';

    angular
        .module('webviewer.layout')
        .directive('wvLayoutLeft', wvLayoutLeft);

    /* @ngInject */
    function wvLayoutLeft() {
        var directive = {
            bindToController: true,
            controller: layoutLeftCtrl,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            require: '^^wvLayout',
            transclude: true,
            scope: {
                asideHidden: '=?wvAsideHidden'
            },
            templateUrl:'app/layout/layout-left.html'
        };
        return directive;

        function link(scope, element, attrs, layoutCtrl) {
            var vm = scope.vm;

            // Set initial values
            vm.asideHidden = !!vm.asideHidden;

            // Propagate to `main` layout section
            layoutCtrl.onAsideLeftHidden.trigger(vm.asideHidden);
            
            // Use $watchGroup to avoid dual triggering on change.
            scope.$watchGroup([
                'vm.asideHidden'
            ], function (newValues, oldValues) {
                // Ignore the first setting (at application startup)
                if (newValues[0] === oldValues[0]) {
                    return;
                }

                // Trigger `hidden` changed event (so the main section can
                // changes its size via css).
                layoutCtrl.onAsideLeftHidden.trigger(newValues[0]);

                // Trigger window resizes (so javascript canvas can be resized
                // adequately). We do this after the digest cycle but prior to
                // the reflow, using asap.
                asap(function() {
                    $(window).trigger('resize');
                });
            });

            // function _triggerResize() {
            //     var start = undefined;
            //     var animationDuration = 700; // ms

            //     // Wait for the current digest cycle to end (so the animation 
            //     // has effectively starts). Use setTimeout instead of $timeout
            //     // to avoid triggering an useless digest cycle (since
            //     // requestAnimationFrame is used as well).
            //     setTimeout(function() {
            //         // Start the animation
            //         requestAnimationFrame(function _triggerResizeAccumulator(timestamp) { // timestamp unit is millisecond (double) 
            //             if (!start) {
            //                 start = timestamp;
            //             }
            //             var progress = timestamp - start;

            //             // Animate progressively
            //             if (progress < animationDuration) {
            //                 // Resize viewports aso.
            //                 $(window).trigger('resize');

            //                 // Loop
            //                 requestAnimationFrame(_triggerResizeAccumulator);
            //             }
            //         });
            //     });
            // }
        }
    }

    /* @ngInject */
    function layoutLeftCtrl() {
        
    }

})();

