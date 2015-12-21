'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvStatePlay
 * @description
 * # wvStatePlay
 */
angular.module('webviewer')
  .directive('wvStatePlay', function ($parse, $interval) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var serieScope = scope;
        var IsActivated = $parse(attrs.wvStatePlay); // method taking a scope as the param

        var _interval = null;
        var speed = 500;

        scope.$on('serie:SerieLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;

          if (activate) {
            if (_interval) return;

            _interval = $interval(function() {
              serieScope.$broadcast('serie:ShowNextInstance', {
                restartWhenSerieEnd: true
              });
            }, speed);
          }
          else {
            if (!_interval) return;
            
            $interval.cancel(_interval);
            _interval = null;
          }
        }
      }
    };
  });
