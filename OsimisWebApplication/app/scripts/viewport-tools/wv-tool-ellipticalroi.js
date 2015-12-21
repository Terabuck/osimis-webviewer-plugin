'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolEllipticalroi
 * @description
 * # wvToolEllipticalroi
 */
angular.module('webviewer')
  .directive('wvToolEllipticalroi', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolEllipticalroi); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'ellipticalRoi',
              arguments: [true]
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'ellipticalRoi'
            });
          }
        }
      }
    };
  });
