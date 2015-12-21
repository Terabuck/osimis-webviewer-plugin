'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvStatePlay
 * @description
 * # wvStatePlay
 */
angular.module('osimiswebviewerApp')
  .directive('wvStatePlay', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();

        scope.$watch(attrs.wvStatePlay, function(activate) {
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
