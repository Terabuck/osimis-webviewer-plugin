'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolPixelprobe
 * @description
 * # wvToolPixelprobe
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolPixelprobe', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvToolPixelprobe, function(activate) {
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
