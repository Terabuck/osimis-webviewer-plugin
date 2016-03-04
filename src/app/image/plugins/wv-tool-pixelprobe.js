'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolPixelprobe
 * @description
 * # wvToolPixelprobe
 */
angular.module('webviewer')
  .directive('wvToolPixelprobe', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var isActivated = $parse(attrs.wvToolPixelprobe); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(isActivated(scope));
        });

        scope.$watch(isActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'probe',
              arguments: [true]
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'probe'
            });
          }
        }
      }
    };
  });
