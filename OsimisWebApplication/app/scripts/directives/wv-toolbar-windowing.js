'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarWindowing
 * @description
 * # wvToolbarWindowing
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarWindowing', function () {
    return {
      scope: {
        wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-sun-o"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {

      }
    };
  });
