'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolAnglemeasure
 * @description
 * # wvToolAnglemeasure
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolAnglemeasure', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvToolAnglemeasure, function(activate) {
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
