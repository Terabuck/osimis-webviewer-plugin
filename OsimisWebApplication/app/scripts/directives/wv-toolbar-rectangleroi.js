'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarRectangleroi
 * @description
 * # wvToolbarRectangleroi
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarRectangleroi', function () {
    return {
      scope: {
      	wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-square-o"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        
      }
    };
  });
