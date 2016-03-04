'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvStateInvert
 * @description
 * # wvStateInvert
 */
angular.module('webviewer')
  .directive('wvStateInvert', function ($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var isActivated = $parse(attrs.wvStateInvert); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(isActivated(scope));
        });

        scope.$watch(isActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          elementScope.$broadcast('viewport:SetViewport', {
            execute: function(viewport) {
              viewport.invert = this.invert;
              return viewport;
            },
            invert: activate
          });
        }
      }
    };
  });
