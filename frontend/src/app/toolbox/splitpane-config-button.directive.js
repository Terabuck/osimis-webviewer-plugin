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
    function wvSplitpaneConfigButton() {
        var directive = {
            bindToController: true,
            controller: SplitpaneConfigButtonVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                splitpaneLayout: '=wvSplitpaneLayout',
                readonly: '=?wvReadonly',
                popoverPlacement: '@?wvPopoverPlacement'
            },
            templateUrl: 'app/toolbox/splitpane-config-button.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
        }
    }

    /* @ngInject */
    function SplitpaneConfigButtonVM($element, $scope, $popover) {
        var _this = this;

        this.splitpaneLayout = typeof this.splitpaneLayout !== 'undefined' ? this.splitpaneLayout : {x: 1, y: 1};
        this.readonly = typeof this.readonly !== 'undefined' ? this.readonly : false;
        this.popoverPlacement = typeof this.popoverPlacement !== 'undefined' ? this.popoverPlacement : 'bottom';

        var popoverScope = $scope.$new();
        this.popover = $popover($element.children().first(), {
            // title: 'Viewport Grid\'s Layout',
            content: 'Viewport Grid\'s Layout',
            placement: _this.popoverPlacement,
            container: 'body',
            autoClose: 1,
            trigger: 'manual',
            templateUrl: 'app/toolbox/splitpane-config-button.popover.html',

            // Option documented in `ngTooltip`, not `ngPopover`, see
            // `https://stackoverflow.com/questions/28021917/angular-strap-popover-programmatic-use`.
            scope: popoverScope
        });
        $scope.$on('$destroy', function() {
            popoverScope.$destroy();
        });

        this.toggleConfig = function() {
            this.popover.$promise
                .then(function() {
                    _this.popover.toggle();
                });
        };
    }
})();