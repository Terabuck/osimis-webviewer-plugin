'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarEllipticalroi
 * @description
 * # wvToolbarEllipticalroi
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarEllipticalroi', function () {
    return {
      scope: {
      	wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-circle-o"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        
      }
    };
  });
