'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportPan
 * @description
 * # wvViewportPan
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportPan', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();
      
        scope.$watch(attrs.wvViewportPan, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.pan.activate(domElement, 0b1 & 0b01); // left & middle mouse
              }
              else {
                tools.pan.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
