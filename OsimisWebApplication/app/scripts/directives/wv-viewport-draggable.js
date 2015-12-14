'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportDraggable
 * @description
 * # wvViewportDraggable
 */

// @require jqueryui
angular.module('osimiswebviewerApp')
.directive('wvViewportDraggable', function () {
  return {
    scope: false,
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      // @todo style
      var clone = $('<div style="width: 200px; height: 200px; background-color: rgba(255,255,255,0.25); z-index: 1;"></div>');
      element.draggable({
        helper: function() {
          return clone;
        }
      });
    }
  };
});
