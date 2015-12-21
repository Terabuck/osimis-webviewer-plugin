'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolZoom
 * @description
 * # wvToolZoom
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolZoom', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvToolZoom, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.zoom.activate(domElement, 0b1 & 0b001); // left & right mouse
              }
              else {
                tools.zoom.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
