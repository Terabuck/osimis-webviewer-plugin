'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarPan
 * @description
 * # wvToolbarPan
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarPan', function () {
    return {
      scope: {
        wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-arrows"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      }
    };
  });
