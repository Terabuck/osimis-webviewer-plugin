'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvStatePlay
 * @description
 * # wvStatePlay
 */
// multi viewports
// @todo should use extension model
angular.module('webviewer')
  .directive('wvStatePlay', function ($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var serieScope = scope;
        var isActivated = $parse(attrs.wvStatePlay); // method taking a scope as the param

        scope.$on('SerieHasChanged', function() {
          _trigger(isActivated(scope));
        });

        scope.$watch(isActivated, _trigger);

        // @todo should use two way databinding w/ serie playing state instead

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;

          if (activate) {
            serieScope.$broadcast('PlaySerie');
          }
          else {
            serieScope.$broadcast('PauseSerie');
          }
        }
      }
    };
  });
