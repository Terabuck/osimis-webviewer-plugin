'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarZoom
 * @description
 * # wvToolbarZoom
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarZoom', function () {
    return {
      scope: {
        wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-search"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      }
    };
  });
