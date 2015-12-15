'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportAnglemeasure
 * @description
 * # wvViewportAnglemeasure
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportAnglemeasure', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportAnglemeasure, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.angle.activate(domElement, true);
              }
              else {
                tools.angle.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
