'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolZoom
 * @description
 * # wvToolZoom
 */
angular.module('webviewer')
  .directive('wvToolZoom', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolZoom); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'zoom',
              arguments: [0x1] // left & right mouse
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'zoom'
            });
          }
        }
      }
    };
  });
