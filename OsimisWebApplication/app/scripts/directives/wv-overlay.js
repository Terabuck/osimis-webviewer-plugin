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
    scope: false,
    transclude: 'true',
    templateUrl: 'scripts/directives/wv-overlay.tpl.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.$on('instance-data', function(evt, tags) {
        scope.$instance = tags;
        if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
          scope.nbWidth = 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
      });
      scope.$on('serie-data', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$serie.InstanceCount = instanceCount;
        if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
          scope.nbWidth = 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
      });
      scope.$on('viewport-data', function(evt, viewport) {
        scope.$viewport = viewport;
      });
    }
  };
}]);
