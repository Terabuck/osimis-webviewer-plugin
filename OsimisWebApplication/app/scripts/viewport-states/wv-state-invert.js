'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvStateInvert
 * @description
 * # wvStateInvert
 */
angular.module('osimiswebviewerApp')
  .directive('wvStateInvert', function ($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvStateInvert); // method taking a scope as the param

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

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
