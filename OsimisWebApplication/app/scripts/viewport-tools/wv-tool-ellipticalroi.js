'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolEllipticalroi
 * @description
 * # wvToolEllipticalroi
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolEllipticalroi', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvToolEllipticalroi, function(activate) {
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
