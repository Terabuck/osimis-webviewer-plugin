'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolLengthmesure
 * @description
 * # wvToolLengthmesure
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolLengthmesure', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvToolLengthmesure, function(activate) {
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
