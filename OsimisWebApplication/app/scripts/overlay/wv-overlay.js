'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvOverlay
 * @description
 * # wvOverlay
 */
angular.module('osimiswebviewerApp')
.directive('wvOverlay', [function() {
  return {
    scope: true,
    transclude: 'true',
    templateUrl: 'scripts/overlay/wv-overlay.tpl.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.$on('viewport:InstanceChanged', function(evt, tags) {
        scope.$instance = tags;
        if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
          scope.nbWidth = 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
      });
      scope.$on('serie:SerieChanged', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$serie.InstanceCount = instanceCount;
        if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
          scope.nbWidth = 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
      });
      scope.$on('viewport:ViewportChanged', function(evt, viewport) {
        scope.$viewport = viewport;
      });
    }
  };
}]);
