'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportEllipticalroi
 * @description
 * # wvViewportEllipticalroi
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportEllipticalroi', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportEllipticalroi, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.ellipticalRoi.activate(domElement, true);
              }
              else {
                tools.ellipticalRoi.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
