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
      }
    };
  });
