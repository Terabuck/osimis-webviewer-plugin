'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewportDraggable
 * @description
 * # wvViewportDraggable
 */

// @require jqueryui
angular.module('webviewer')
.directive('wvViewportDraggable', function($, $parse) {
  return {
    scope: false,
    restrict: 'A',
    link: function postLink(scope, element, attrs, serieCtrl) {
      var _serie = null;

      scope.$on('SerieHasChanged', function(evt, serie) {
        _serie = serie;
      });

      // @todo style the clone handler
      var clone = $('<div class="wv-draggable-clone"></div>');
      element.draggable({
        helper: function() {
          return clone;
        },
        start: function(evt, ui) {
          var draggedElement = ui.helper;
          draggedElement.data('serie-id', _serie.id);
          draggedElement.width(element.width());
          draggedElement.height(element.height());
        },
        zIndex: 100
      });
    }
  };
});
