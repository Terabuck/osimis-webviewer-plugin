/**
 * @ngdoc directive
 * @name webviewer.toolbox.directive:wvToolbox
 * 
 * @restrict Element
 * @scope
 *
 * @param {object} splitpaneLayout
 * The splitpane layout object. It is modified according to the end-user
 * preference.
 *
 * It contains two values:
 *
 * * {number} `x` The number of column.
 * * {number} `y` The number of row.
 *  
 * @param {boolean} [wvReadonly=false]
 * The `wvReadonly` parameter prevent the configuration popover from being
 * opened.
 * 
 * @param {string} [wvPopoverPlacement='bottom']
 * The configuration popover placement on the screen. This parameter is useful
 * when we display the toolbar on the right of the screen instead of the top.
 * 
 * Can either be:
 * 
 * * `bottom`
 * * `left`
 *
 * @description
 * The `wvSplitpaneConfigButton` directive is a button which opens a
 * configuration panel on click. This configuration panel let the end-user
 * change the number of viewport drawn on the screen.
 *
 * It is purely an UI component though. The model is changed through
 * databinding via the `wvSplitpaneLayout` parameter.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSplitpaneConfigButton', wvSplitpaneConfigButton);

    /* @ngInject */
    function wvSplitpaneConfigButton($timeout) {
        var directive = {
            bindToController: true,
            controller: SplitpaneConfigButtonVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                splitpaneLayout: '=wvSplitpaneLayout',
                readonly: '=?wvReadonly',
                popoverPlacement: '@?wvPopoverPlacement',
                buttonSize: '@?wvButtonSize'
            },
            templateUrl: 'app/toolbox/splitpane-config-button.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
            vm.buttonSize = vm.buttonSize === undefined ? "small" : vm.buttonSize;
            var buttonEl = element.children().first();
            
            // Toggle popover on mouse over/out.
            buttonEl.bind('mouseenter', function (e) {
                if (!vm.readonly && !vm.insidePopover) {
                    try {
                        vm.popover.show();
                    }
                    catch (e) {
                        // Ignore `Cannot read property '0' of undefined` exception when 
                        // the button is hovered at app startup. This as no negative
                        // effect.
                    }
                    vm.attachEventsToPopoverContent();
                }
            });

            buttonEl.bind('mouseleave', function (e) {
                // Timeout to make sure the user can move it's cursor from the button
                // to the popover without having the popover to hide in between.
                $timeout(function () {
                    if (!vm.insidePopover) {
                        vm.popover.hide();
                    }
                }, 100);
            });
        }
    }

    /* @ngInject */
    function SplitpaneConfigButtonVM($element, $scope, $popover) {
        var _this = this;
        var buttonEl = $element.children().first();

        this.splitpaneLayout = typeof this.splitpaneLayout !== 'undefined' ? this.splitpaneLayout : {x: 1, y: 1};
        this.readonly = typeof this.readonly !== 'undefined' ? this.readonly : false;
        this.popoverPlacement = typeof this.popoverPlacement !== 'undefined' ? this.popoverPlacement : 'bottom';
        this.insidePopover = false;

        // Don't exit popover on when mouse leave the button.
        this.attachEventsToPopoverContent = function () {
            $(_this.popover.$element).on('mouseenter', function () {
                _this.insidePopover = true;
            });
            $(_this.popover.$element).on('mouseleave', function () {
                _this.insidePopover = false;
                _this.popover.hide();
            });
        };

        // Popover configuration
        var popoverScope = $scope.$new();
        this.popover = $popover($element.children().first(), {
            // title: 'Viewport Grid\'s Layout',
            content: 'Viewport Grid\'s Layout',
            placement: _this.popoverPlacement,
            container: 'body',
            trigger: 'manual',
            templateUrl: 'app/toolbox/splitpane-config-button.popover.html',

            // Option documented in `ngTooltip`, not `ngPopover`, see
            // `https://stackoverflow.com/questions/28021917/angular-strap-popover-programmatic-use`.
            scope: popoverScope
        });
        $scope.$on('$destroy', function() {
            popoverScope.$destroy();
        });
    }
})();