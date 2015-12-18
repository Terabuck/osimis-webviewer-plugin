'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarButton
 * @description
 * # wvToolbarButton
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarButton', function () {
    return {
      require: ['wvToolbarButton', '^wvToolbar'],
      scope: {
        wvName: '@',
        wvModel: '=',
        wvIcon: '@',
      },
      template: '<button type="button" ng-class="{btn: true, \'btn-sm\': true, \'btn-default\': true, active: wvModel}" ng-click="click()"><span ng-class="wvIcon"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs, ctrls) {
        var buttonCtrl = ctrls[0];
        var toolbarCtrl = ctrls[1];
        scope.wvModel = !!scope.wvModel;

        toolbarCtrl.register(scope.wvName, scope.wvModel);
        toolbarCtrl.onChange(scope.wvName, function(v) {
            scope.wvModel = v;
          });
        scope.$watch('wvModel', function(v) {
          toolbarCtrl.set(scope.wvName, v);
        });
        scope.click = function() {
          toolbarCtrl.set(scope.wvName, !scope.wvModel);
        }
      },
      controller: function() {

      }
    };
  });
