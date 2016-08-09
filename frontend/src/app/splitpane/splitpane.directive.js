'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvSplitpane
 * @description
 * # wvSplitpane
 */
angular.module('webviewer')
.directive('wvSplitpane', function ($, $timeout) {
    return {
        scope: {
            wvLayout: '=?'
        },
        templateUrl: 'app/splitpane/splitpane.directive.html',
        restrict: 'E',
        transclude: {
            panePolicy: 'wvPanePolicy'
        },
        controller: function() {}, // Must be present for 'require' to work within wvPanePolicy
        link: function postLink(scope, element, attrs) {
          /* jshint -W116 */
              scope.wvLayout = scope.wvLayout || {
                x: 1,
                y: 1
              };
          /* jshint +W116 */

          scope.$watch('wvLayout', _updateLayout, true);

          function _updateLayout(layout, old) {
            if (!layout) return;

            scope.x = [layout.x];
            scope.y = [layout.y];
            scope.rowHeight = 100 / layout.y + '%';
            scope.rowWidth = 100 / layout.x + '%';

            // @note trigger this after reflow
            $timeout(function() {
                $(window).resize();
            });
          }
        }
  };
  });
