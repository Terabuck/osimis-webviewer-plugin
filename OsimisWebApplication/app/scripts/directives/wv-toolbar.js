'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbar
 * @description
 * # wvToolbar
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbar', function () {
    return {
      scope: {},
      templateUrl: 'scripts/directives/wv-toolbar.tpl.html',
      transclude: true,
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      },
      controller: function($scope) {
        $scope.buttons = {};

        this.register = function(name, value) {
          $scope.buttons[name] = value;
        }
        this.disable = function() {
          $scope.buttons.forEach(function(v) {
            v = !v;
          })
        }
        this.set = function(name, value) {
          $scope.buttons[name] = value;
        }
        this.onChange = function(name, fn) {
          $scope.$watch('buttons.'+name, fn);
        }
      }
    };
  });
