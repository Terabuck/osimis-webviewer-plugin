'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbarAction
 * @description
 * # wvToolbarAction
 */
angular.module('webviewer')
.directive('wvToolbarAction', function ($parse) {
  return {
    require: ['^^wvToolbar'],
    scope: true,
    templateUrl: 'app/toolbar/wv-toolbar-action.tpl.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.wvName = attrs.wvName;
      scope.wvIcon = attrs.wvIcon;
      scope.wvAction = $parse(attrs.wvAction).bind($parse, scope);
    },
    controller: function() {

    }
  };
});
