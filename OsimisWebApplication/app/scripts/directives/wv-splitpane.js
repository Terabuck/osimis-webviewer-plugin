'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvSplitpane
 * @description
 * # wvSplitpane
 */
angular.module('osimiswebviewerApp')
  .directive('wvSplitpane', function () {
    return {
      scope: {
        wvLayout: '=?',
        wvSettings: '=?'
      },
      templateUrl: 'scripts/directives/wv-splitpane.tpl.html',
      restrict: 'E',
      transclude: true,
      link: function postLink(scope, element, attrs) {
        if (scope.wvLayout == undefined) {
          scope.wvLayout = {
            x: 1,
            y: 1
          }
        }
        scope.x = [scope.wvLayout.x];
        scope.y = [scope.wvLayout.y];

        scope.rowHeight = 100 / scope.wvLayout.y + '%';
        scope.rowWidth = 100 / scope.wvLayout.x + '%';
        // scope.cellClasses = ['col-sm-' + 12/scope.wvLayout.x];
        scope.$watch('wvLayout', function(wvLayout, old) {
          scope.x = [wvLayout.x];
          scope.y = [wvLayout.y];
          scope.rowHeight = 100 / scope.wvLayout.y + '%';
          scope.rowWidth = 100 / scope.wvLayout.x + '%';

          $(window).resize();
        }, true);
      }
    };
  });
