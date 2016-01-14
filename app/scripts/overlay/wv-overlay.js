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

      scope.$emit('serie:GetSerieData', function(tags, instanceCount) {
        if (!tags || typeof instanceCount === 'undefined') return;
        _onSerieData(tags, instanceCount);
      });
      scope.$emit('viewport:GetInstanceData', function(tags) {
        if (!tags) return;
        _onInstanceData(tags);
      });
      scope.$emit('viewport:GetViewportData', function(viewport) {
        if (!viewport) return;
        _onViewportData(viewport);
      });

      scope.$on('serie:SerieChanged', function(evt, tags, instanceCount) {
        _onSerieData(tags, instanceCount);
        scope.$instance = {}; // instance should change automaticaly
      });
      scope.$on('viewport:InstanceChanged', function(evt, tags) {
        _onInstanceData(tags);
      });
      scope.$on('viewport:ViewportChanged', function(evt, viewport) {
        _onViewportData(viewport);
      });

      function _onSerieData(tags, instanceCount) {
        scope.$serie = tags;
        scope.$instanceCount = instanceCount;
      }

      function _onInstanceData(tags) {
        scope.$instance = tags;

        if (!scope.$instance) {
          scope.showTopRightArea = false;
          scope.showTopLeftArea = false;
        }
        else {
          scope.showTopRightArea = typeof scope.$instance.SeriesNumber !== 'undefined' && typeof scope.$instance.SeriesDescription !== 'undefined';
          scope.showTopLeftArea = true;
        }
      }

      function _onViewportData(viewport) {
        scope.$viewport = viewport;

        if (!viewport) {
          scope.showBottomRightArea = false;
        }
        else {
          scope.$viewport.scale = parseFloat(viewport.scale).toFixed(2);
          scope.$viewport.voi.windowWidth = parseFloat(viewport.voi.windowWidth).toFixed(2);
          scope.$viewport.voi.windowCenter = parseFloat(viewport.voi.windowCenter).toFixed(2);
          scope.showBottomRightArea = true;
        }
      }
    }
  };
}]);
