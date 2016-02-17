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
        var wvScrollOnOver = $parse(attrs.wvScrollOnOver); // method taking a scope as the param
        var _isEnabled = false;

        scope.$on('SerieHasChanged', function() {
          var enable = wvScrollOnOver(scope);
          _trigger(enable);
        });

        scope.$watch(wvScrollOnOver, _trigger);

        function _trigger(enable) {
          if (typeof enable === 'undefined') return;

          if (enable && !_isEnabled) {
            element
            .on('mouseover', mouseoverEvt)
            .on('mouseout', mouseoutEvt);
            _isEnabled = true;
          }
          else if (!enable && _isEnabled) {
            scope.$broadcast('serie:Pause');
            element.off('mouseover', mouseoverEvt);
            element.off('mouseout', mouseoutEvt);
            _isEnabled = false;
          }

          function mouseoverEvt() {
            scope.$broadcast('PlaySerie', {
              speed: 1000/25 // 25fps
            });
          }
          function mouseoutEvt() {
            scope.$broadcast('PauseSerie');
          }
        }
      }
    };
  });
