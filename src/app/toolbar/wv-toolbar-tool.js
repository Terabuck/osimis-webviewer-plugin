'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbarTool
 * @description
 * # wvToolbarTool
 */
angular.module('webviewer')
.directive('wvToolbarTool', function () {
  return {
    require: ['^^wvToolbar'],
    scope: true,
    templateUrl: '/src/app/toolbar/wv-toolbar-tool.tpl.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.wvName = attrs.wvName;
      scope.wvIcon = attrs.wvIcon;
    },
    controller: function() {

    }
  };
});
