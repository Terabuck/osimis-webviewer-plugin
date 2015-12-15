'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportInvert
 * @description
 * # wvViewportInvert
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportInvert', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();
      
        /*
        var getter = $parse(attrs.wvViewportInvert);
        var setter = getter.assign;
        
        var value = getter(scope);
        if (value === null || value == undefined) setter(scope, false);
        */

        scope.$watch(attrs.wvViewportInvert, function(invert) {
          if (invert == undefined) return;
          elementScope.$broadcast('viewport-command', {
            execute: function(viewport) {
              viewport.invert = this.invert;
              return viewport;
            },
            invert: invert
          });
        });
      }
    };
  });
