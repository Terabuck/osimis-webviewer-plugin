'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportRectangleroi
 * @description
 * # wvViewportRectangleroi
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportRectangleroi', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportRectangleroi, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.rectangleRoi.activate(domElement, true);
              }
              else {
                tools.rectangleRoi.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
