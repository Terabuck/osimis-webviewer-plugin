'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvOverlayScrollbar
 * @description
 * # wvOverlayScrollbar
 */
angular.module('webviewer')
.directive('wvOverlayScrollbar', function () {
return {
  scope: true,
  templateUrl: 'scripts/overlay/wv-overlay-scrollbar.tpl.html',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    scope.scrollbarDistanceFromRight = '0%';

    scope.$on('viewport:InstanceChanged', function(evt, tags) {
      requestAnimationFrame(function() {
        if (!scope.$serie) return;
        
        var eq = Math.ceil(100 * scope.$instance.InstanceNumber / scope.$instanceCount);
        scope.scrollbarDistanceFromRight = 100 - eq + '%';
        scope.$digest();
      });
    });

    scope.$on('serie:SerieChanged', function(evt, tags, instanceCount) {
      requestAnimationFrame(function() {
        if (!scope.$instance) return;

        var eq = Math.ceil(100 * scope.$instance.InstanceNumber / scope.$instanceCount);
        scope.scrollbarDistanceFromRight = 100 - eq + '%';
        scope.$digest();
      });
    });
  }
};
});
