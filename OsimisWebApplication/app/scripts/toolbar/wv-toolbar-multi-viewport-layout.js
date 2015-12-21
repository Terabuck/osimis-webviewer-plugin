'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbarMultiViewportLayout
 * @description
 * # wvToolbarMultiViewportLayout
 */
angular.module('webviewer')
  .directive('wvToolbarMultiViewportLayout', function () {
    return {
      scope: {
        wvLayout: '='
      },

      template: '\
        <button type="button" class="btn btn-sm btn-default" bs-select bs-options="item.value as item.label for item in items" ng-model="wvLayout" html="1" placeholder="<span class=&quot;fa fa-th-large&quot;></span>" icon-checkmark="fa fa-th-large">\
        </button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.items = [
          {"value": {x: 1, y: 1}, "label": "1x1"},
          {"value": {x: 2, y: 1}, "label": "2x1"},
          {"value": {x: 1, y: 2}, "label": "1x2"},
          {"value": {x: 2, y: 2}, "label": "2x2"}
        ];
      }
    };
  });
