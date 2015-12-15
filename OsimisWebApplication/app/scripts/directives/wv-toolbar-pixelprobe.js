'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarPixelprobe
 * @description
 * # wvToolbarPixelprobe
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarPixelprobe', function () {
    return {
      scope: {
      	wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-dot-circle-o"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        
      }
    };
  });
