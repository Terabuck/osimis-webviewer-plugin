'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportZoom
 * @description
 * # wvViewportZoom
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportZoom', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportZoom, function(activate) {
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
