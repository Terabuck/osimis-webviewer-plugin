'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportPlay
 * @description
 * # wvViewportPlay
 */
angular.module('osimiswebviewerApp')
  .directive('wvViewportPlay', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvViewportPlay, function(activate) {
          if (activate == undefined) return;

          elementScope.$broadcast('play-command', {
            execute: function() {
              return this.activate;
            },
            activate: activate
          });
        });
      }
    };
  });
