'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvScrollOnOver
 * @description
 * # wvScrollOnOver
 */
angular.module('webviewer')
  .directive('wvScrollOnOver', function ($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var serieScope = scope;
        var IsActivated = $parse(attrs.wvScrollOnOver); // method taking a scope as the param

        scope.$on('serie:SerieLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;

          if (activate) {
            element
            .on('mouseover', function mouseoverEvt() {
              serieScope.$broadcast('serie:Play', {
                speed: 1000/25 // 25fps
              });
            })
            .on('mouseout', function mouseoutEvt() {
              serieScope.$broadcast('serie:Pause');
            });
          }
          else {
            serieScope.$broadcast('serie:Pause');
            element.off('mouseover', mouseoverEvt);
            element.off('mouseout', mouseoutEvt);
          }
        }
      }
    };
  });
