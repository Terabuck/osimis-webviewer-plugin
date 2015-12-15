'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportLengthmesure
 * @description
 * # wvViewportLengthmesure
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportLengthmesure', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportLengthmesure, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.length.activate(domElement, true);
              }
              else {
                cornerstoneTools.mouseInput.disable(domElement);
                tools.length.activate(domElement, false);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
