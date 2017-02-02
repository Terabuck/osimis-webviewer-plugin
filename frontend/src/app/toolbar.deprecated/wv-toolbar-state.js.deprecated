/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbarState
 * 
 * @restrict Element
 */
(function() {
  'use strict';

  angular.module('webviewer')
  .directive('wvToolbarState', function () {
    return {
      require: ['^^wvToolbar'],
      scope: true,
      templateUrl: 'app/toolbar/wv-toolbar-state.tpl.html',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.wvName = attrs.wvName;
        scope.wvIcon = attrs.wvIcon;
        scope.wvIconOn = attrs.wvIconOn;
        scope.wvIconOff = attrs.wvIconOff;
      },
      controller: function() {

      }
    };
  });
})();
