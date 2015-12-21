'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolWindowing
 * @description
 * # wvToolWindowing
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolWindowing', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();
      
        scope.$watch(attrs.wvToolWindowing, function(activate) {
          if (activate == undefined) return;

	      	// @todo remove ? this is the default behavior..
          elementScope.$broadcast('tool-command', {
            execute: function(domElement, tools) {
              if (this.activate) {
                cornerstoneTools.mouseInput.enable(domElement);
                tools.wwwc.activate(domElement, 0b1); // left clic
              }
              else {
                tools.wwwc.deactivate(domElement);
                cornerstoneTools.mouseInput.disable(domElement);
              }
            },
            activate: activate
          });
        });
      }
    };
  });
