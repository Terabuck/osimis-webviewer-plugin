'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvStatePlay
 * @description
 * # wvStatePlay
 */
angular.module('webviewer')
  .directive('wvStatePlay', function ($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var serieScope = scope;
        var isActivated = $parse(attrs.wvStatePlay); // method taking a scope as the param

        scope.$on('serie:SerieLoaded', function() {
          _trigger(isActivated(scope));
        });

        scope.$watch(isActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;

          if (activate) {
            serieScope.$broadcast('serie:Play');
          }
          else {
            serieScope.$broadcast('serie:Pause');
          }
        }
      }
    };
  });
