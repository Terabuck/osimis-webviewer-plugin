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
  templateUrl: 'app/overlay/wv-overlay-scrollbar.tpl.html',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    scope.scrollbarDistanceFromRight = '0%';

    scope.$watchGroup(['$instance.InstanceNumber', '$instanceCount'], _setScrollbarDimension);
    scope.$evalAsync(function() {
      _setScrollbarDimension();
    });

    function _setScrollbarDimension() {
      requestAnimationFrame(function() {
        if (!scope.$instance || typeof scope.$instanceCount === 'undefined') return;

        var eq = Math.ceil(100 * scope.$instance.InstanceNumber / scope.$instanceCount);
        scope.scrollbarDistanceFromRight = 100 - eq + '%';
        scope.$digest();
      });
    }
  }
};
});
