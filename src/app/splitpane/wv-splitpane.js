'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvSplitpane
 * @description
 * # wvSplitpane
 */
angular.module('webviewer')
  .directive('wvSplitpane', function () {
    return {
      scope: {
        wvLayout: '=?',
        wvSettings: '=?'
      },
      // @todo add template path angular constant
      templateUrl: '/src/app/splitpane/wv-splitpane.tpl.html',
      restrict: 'E',
      transclude: true,
      link: function postLink(scope, element, attrs) {
        if (scope.wvLayout == undefined) {
          scope.wvLayout = scope.wvSettings && scope.wvSettings.layout || {
            x: 1,
            y: 1
          }
        }

        _updateLayout(scope.wvLayout);
        
        scope.$watch('wvSettings.layout', _updateLayout, true);
        scope.$watch('wvLayout', _updateLayout, true);

        function _updateLayout(layout, old) {
          if (!layout) return;
          
          scope.x = [layout.x];
          scope.y = [layout.y];
          scope.rowHeight = 100 / layout.y + '%';
          scope.rowWidth = 100 / layout.x + '%';

          $(window).resize();
        }
      }
    };
  });
