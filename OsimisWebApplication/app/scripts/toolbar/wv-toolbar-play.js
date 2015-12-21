'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbarPlay
 * @description
 * # wvToolbarPlay
 */
angular.module('webviewer')
  .directive('wvToolbarPlay', function () {
    return {
      scope: {
      	wvEnable: '='
      },
      template: '<button type="button" class="btn btn-sm btn-default" ng-model="wvEnable" bs-checkbox><span class="fa"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        var iconElement = element.children().children();
        
        scope.wvEnable = !!scope.wvEnable;
        if (!scope.wvEnable) { // @todo refactor
          iconElement.addClass('fa-play');
        }
        else {
          iconElement.addClass('fa-pause');
        }

        scope.$watch('wvEnable', function(wvEnable, old) {
          if (wvEnable == old) return;

          if (!wvEnable) {
            iconElement.removeClass('fa-pause');
            iconElement.addClass('fa-play');
          }
          else {
            iconElement.removeClass('fa-play');
            iconElement.addClass('fa-pause');
          }
        });
      }
    };
  });
