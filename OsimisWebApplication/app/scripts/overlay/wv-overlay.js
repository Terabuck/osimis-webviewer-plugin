'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvOverlay
 * @description
 * # wvOverlay
 */
angular.module('webviewer')
.directive('wvOverlay', [function() {
  return {
    scope: {},
    transclude: 'true',
    templateUrl: 'scripts/overlay/wv-overlay.tpl.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs, ctrl, transcludeFn) {
      scope.showTopLeftArea = false;
      scope.showTopRightArea = false;
      scope.showBottomRightArea = false;

      var transcludeElement = element.children('.wv-overlay');
      transcludeFn(scope, function(clone) {
        if (clone.length > 0) {
          transcludeElement.replaceWith(clone);
        }
      });

      scope.$on('viewport:InstanceChanged', function(evt, tags) {
        scope.$instance = tags;

        scope.showTopRightArea = typeof scope.$instance.SeriesNumber !== 'undefined' && typeof scope.$instance.SeriesDescription !== 'undefined';
        scope.showTopLeftArea = true;
      });

      scope.$on('serie:SerieChanged', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$instanceCount = instanceCount;
        scope.$instance = {};
      });

      scope.$on('viewport:ViewportChanged', function(evt, viewport) {
        scope.$viewport = viewport;
        scope.$viewport.scale = parseFloat(viewport.scale).toFixed(2);
        scope.$viewport.voi.windowWidth = parseFloat(viewport.voi.windowWidth).toFixed(2);
        scope.$viewport.voi.windowCenter = parseFloat(viewport.voi.windowCenter).toFixed(2);
        scope.showBottomRightArea = true;
      });
    }
  };
}]);
