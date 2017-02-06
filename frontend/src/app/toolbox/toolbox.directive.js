/**
 * @ngdoc directive
 * @name webviewer.toolbox.directive:wvToolbox
 * 
 * @restrict Element
 */
(function () {
    'use strict';

    angular
        .module('webviewer.toolbox')
        .directive('wvToolbox', wvToolbox);

    /* @ngInject */
    function wvToolbox($timeout) {
        var directive = {
            bindToController: true,
            controller: toolboxCtrl,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                buttons: '=wvToolboxButtons', // input + output
                tool: '=?wvActiveTool', // output (duplicate with buttons as an output
                // - avoid lifecycle ordering issue when switching tool though, for instance
                // deactivated tool always occurs before the activation of another one)
                readonly: '=?wvReadonly' // default: false
            },
            templateUrl: 'app/toolbox/toolbox.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm || {};

            vm.readonly = (typeof vm.readonly === 'undefined') ? false : vm.readonly;

            vm.tool = vm.tool || 'windowing';
            vm.state = {
                invert: false
            };

            // Propagate buttons to tool/state (for liveshare)
            scope.$watch('vm.buttons', function (buttons) {
                for (var label in buttons) {
                    if (vm.state.hasOwnProperty(label)) {
                        vm.state[label] = buttons[label];
                    }
                    else {
                        // vm.tool = buttons[label];
                        // already done in js
                    }
                }
            }, true);

            // @todo refactor
            scope.$watch('vm.state', function (states) {
                for (var state in states) {
                    vm.buttons[state] = states[state];
                }
            }, true);

            scope.$watch('vm.tool', function (tool, oldTool) {
                if (tool == oldTool) return;

                if (vm.buttons.hasOwnProperty(oldTool)) {
                    vm.buttons[oldTool] = false;
                }
                $timeout(function () {
                    if (vm.buttons.hasOwnProperty(tool)) {
                        vm.buttons[tool] = true;
                    }
                });

            });
        }
    }

    /* @ngInject */
    function toolboxCtrl($timeout) {
        var vm = this;
    }

})();

