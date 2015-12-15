'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarStackscroll
 * @description
 * # wvToolbarStackscroll
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarStackscroll', function () {
    return {
      scope: {
        wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-bars"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      }
    };
  });
