'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolLengthmeasure
 * @description
 * # wvToolLengthmeasure
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolLengthmeasure', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvToolLengthmeasure, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.length.activate(domElement, true);
              }
              else {
                tools.length.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
