'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarAnglemeasure
 * @description
 * # wvToolbarAnglemeasure
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarAnglemeasure', function () {
    return {
      scope: {
      	wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa fa-angle-left"></span></button>',
      link: function postLink(scope, element, attrs) {}
    };
  });
