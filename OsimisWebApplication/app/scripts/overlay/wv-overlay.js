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
    link: function postLink(scope, element, attrs) {
      scope.showTopRight = false;
      scope.showBottomRight = false;
      // scope.base = 0.1 + '%';

      scope.$on('viewport:InstanceChanged', function(evt, tags) {
        scope.$instance = tags;
        //if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
        //  scope.pcFromRight = 100 - 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
        
        requestAnimationFrame(function() {
          if (!scope.$serie) return;
          
          //scope.base = 100 - 100/scope.$serie.InstanceCount+'%';
          var eq = Math.ceil(100 * scope.$instance.InstanceNumber / scope.$serie.InstanceCount);
          scope.scaleX = 100 - eq + '%';
          scope.$digest();
        });

        scope.showTopRight = typeof scope.$instance.SeriesNumber !== 'undefined' && typeof scope.$instance.SeriesDescription !== 'undefined';
      });
      scope.$on('serie:SerieChanged', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$serie.InstanceCount = instanceCount;
        scope.$instance = {};
        scope.scaleX = '0%';
        //if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
        //  scope.pcFromRight = 100 - 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';

        requestAnimationFrame(function() {
          if (!scope.$instance) return;

          //scope.base = 100 - 100/scope.$serie.InstanceCount+'%';
          var eq = Math.ceil(100 * scope.$instance.InstanceNumber / scope.$serie.InstanceCount);
          scope.scaleX = 100 - eq + '%';
          scope.$digest();
        });
      });
      scope.$on('viewport:ViewportChanged', function(evt, viewport) {
        if (!viewport) debugger;
        scope.$viewport = viewport;
        scope.$viewport.scale = parseFloat(viewport.scale).toFixed(2);
        scope.$viewport.voi.windowWidth = parseFloat(viewport.voi.windowWidth).toFixed(2);
        scope.$viewport.voi.windowCenter = parseFloat(viewport.voi.windowCenter).toFixed(2);
        scope.showBottomRight = true;
      });
    }
  };
}]);
