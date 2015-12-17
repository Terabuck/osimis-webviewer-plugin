'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolPan
 * @description
 * # wvToolPan
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolPan', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();
      
        scope.$watch(attrs.wvToolPan, function(activate) {
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
