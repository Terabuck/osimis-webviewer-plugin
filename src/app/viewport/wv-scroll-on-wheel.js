'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvScrollOnWheel
 * @description
 * # wvScrollOnWheel
 */

// one viewport at most
angular.module('webviewer')
  .directive('wvScrollOnWheel', function (hamster, $parse) {
    return {
      scope: false,
      restrict: 'A',
      // @todo, should not require as it could be used in upper tags
      // -> use scope/attributes passing
      require: 'wvViewportSerie',
      link: function postLink(scope, element, attrs, serieCtrl) {
        // @note one-way binding
        var wvScrollOnWheel = $parse(attrs.wvScrollOnWheel);

        var _serie = null;

        scope.$on('SerieHasChanged', function(evt, serie) {
          var isEnabled = wvScrollOnWheel(scope);
          var isInit = !_serie && serie;
          var isDestroy = _serie && !serie;

          _serie = serie;
          
          if (isInit && isEnabled) {
            _enable();
          }
          else if (isDestroy && isEnabled) {
            _disable();
          }
        });

        scope.$watch(wvScrollOnWheel, function(isEnabled) {
          if (isEnabled && _serie) {
            _enable();
          }
          else if (!isEnabled && _serie) {
            _disable();
          }
        });

        scope.$on('$destroy', function() {
          var isEnabled = wvScrollOnWheel(scope);
          if (isEnabled) {
            _disable();
          }
        });

        function _enable() {
          hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
            if (deltaY < 0) {
              scope.$apply(function() {
                _serie.goToPreviousInstance();
              });
            }
            else if (deltaY > 0) {
              // @todo calibrate the required speed and accuracy for the enduser
              scope.$apply(function() {
                _serie.goToNextInstance(false);
              });
            }

            // prevent horizontal & vertical page scrolling
            event.preventDefault();
          });
        }

        function _disable() {
          hamster(element[0]).unwheel();
        }
      }
    };
  });
