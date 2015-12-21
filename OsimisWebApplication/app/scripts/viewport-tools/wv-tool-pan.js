'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolPan
 * @description
 * # wvToolPan
 */
angular.module('webviewer')
  .directive('wvToolPan', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolPan); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'pan',
              arguments: [0b1 & 0b01] // left & middle mouse
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'pan'
            });
          }
        }
      }
    };
  });
