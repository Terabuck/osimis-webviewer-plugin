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
        wvLayout: '=?',
        wvSettings: '=?' // used by transcluded directives
      },
      // @todo add template path angular constant
      templateUrl: 'app/splitpane/wv-splitpane.tpl.html',
      restrict: 'E',
      transclude: true,
      link: function postLink(scope, element, attrs, ctrls, transcludeFn) {
          // make sure default content is not created if there is transclusion
          // I don't use angular transclude fallback because its buggy
          scope.showDefaultContent = false;
          transcludeFn(function(trancludedContent) {
              // ignore empty strings
              if (!_.filter(trancludedContent, function(v) {return v instanceof HTMLElement || _.trim(v.textContent).length}).length) {
                  scope.showDefaultContent = true
              }
          });
          
        /* jshint -W116 */
          scope.wvLayout = scope.wvLayout || scope.wvSettings && scope.wvSettings.layout || {
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
