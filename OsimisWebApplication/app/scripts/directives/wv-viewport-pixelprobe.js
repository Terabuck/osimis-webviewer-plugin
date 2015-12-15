'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportPixelprobe
 * @description
 * # wvViewportPixelprobe
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportPixelprobe', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportPixelprobe, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.probe.activate(domElement, true);
              }
              else {
                tools.probe.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
