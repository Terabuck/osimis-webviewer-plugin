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
      var elementScope = angular.element(element).isolateScope();

      // @todo style
      var clone = $('<div class="wv-draggable-clone"></div>');
      element.draggable({
        helper: function() {
          return clone;
        },
        start: function(evt, ui) {
          var draggedElement = ui.helper;
          draggedElement.data('serie-id', elementScope.wvSerieId);
        },
        zIndex: 100
      });
    }
  };
});
