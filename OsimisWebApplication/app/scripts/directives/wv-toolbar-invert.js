'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarInvert
 * @description
 * # wvToolbarInvert
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarInvert', function () {
    return {
      scope: {
        wvInvert: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvInvert" bs-checkbox><span class="fa fa-adjust"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      }
    };
  });
