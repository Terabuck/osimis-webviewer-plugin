'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolAnglemeasure
 * @description
 * # wvToolAnglemeasure
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolAnglemeasure', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolAnglemeasure); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'angle',
              arguments: [true]
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'angle'
            });
          }
        }
      }
    };
  });
