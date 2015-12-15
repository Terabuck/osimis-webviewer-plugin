'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarLengthmesure
 * @description
 * # wvToolbarLengthmesure
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarLengthmesure', function () {
    return {
      scope: {
      	wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-arrows-v"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        
      }
    };
  });
