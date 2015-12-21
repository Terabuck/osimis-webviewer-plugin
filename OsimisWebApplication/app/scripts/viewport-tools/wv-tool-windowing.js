'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolWindowing
 * @description
 * # wvToolWindowing
 */
angular.module('webviewer')
  .directive('wvToolWindowing', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolWindowing); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'wwwc',
              arguments: [0b1] // left mouse
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'wwwc'
            });
          }
        }

      }
    };
  });
