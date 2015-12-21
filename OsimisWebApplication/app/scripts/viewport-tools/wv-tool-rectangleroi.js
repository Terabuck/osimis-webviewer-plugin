'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolRectangleroi
 * @description
 * # wvToolRectangleroi
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolRectangleroi', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolRectangleroi); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'rectangleRoi',
              arguments: [true]
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'rectangleRoi'
            });
          }
        }
      }
    };
  });
