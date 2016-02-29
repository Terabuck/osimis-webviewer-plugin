'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolLengthmeasure
 * @description
 * # wvToolLengthmeasure
 */
angular.module('webviewer')
  .directive('wvToolLengthmeasure', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var isActivated = $parse(attrs.wvToolLengthmeasure); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(isActivated(scope));
        });

        scope.$watch(isActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ActivateTool', {
              tool: 'length',
              arguments: [true]
            });
          }
          else {
            elementScope.$broadcast('viewport:DeactivateTool', {
              tool: 'length'
            });
          }
        }
      }
    };
  });
