'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvScrollOnWheel
 * @description
 * # wvScrollOnWheel
 */
angular.module('webviewer')
  .directive('wvScrollOnWheel', function ($parse) {
    return {
      scope: false,
      restrict: 'A',
      require: 'wvViewportSerie',
      link: function postLink(scope, element, attrs, serieCtrl) {
        var serieScope = scope;
        var IsActivated = $parse(attrs.wvScrollOnWheel); // method taking a scope as the param

        scope.$on('serie:SerieLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        // @todo unregister on scope $destroy

        function _trigger(activate, old) {
          if (typeof activate === 'undefined' || activate === old) return;

          if (activate) {
            // Hamster = cross browser mousewheel library
            Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
              if (deltaY < 0) {
                scope.$apply(function() {
                  serieCtrl.showPreviousInstance();
                });

                event.preventDefault();
              }
              else if (deltaY > 0) {
                // @todo calibrate the required speed and accuracy for the enduser
                scope.$apply(function() {
                  serieCtrl.showNextInstance(false);
                });

                event.preventDefault();
              }

              // prevent horizontal page scrolling
              event.preventDefault();
            });
            
          }
          else {
            Hamster(element[0]).unwheel();
          }
        }
      }
    };
  });
