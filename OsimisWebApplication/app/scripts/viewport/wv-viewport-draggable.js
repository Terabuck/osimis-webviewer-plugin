'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewportDraggable
 * @description
 * # wvViewportDraggable
 */

// @require jqueryui
angular.module('webviewer')
.directive('wvViewportDraggable', function($parse) {
  return {
    scope: false,
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      var serieScope = scope; // @todo use directive communication w/ angular require instead 'coz this directive is dependant

      var GetSerieId = $parse(attrs.wvViewportSerie); // method taking a scope as the param
      
      // @todo style
      var clone = $('<div class="wv-draggable-clone"></div>');
      element.draggable({
        helper: function() {
          return clone;
        },
        start: function(evt, ui) {
          var draggedElement = ui.helper;
          draggedElement.data('serie-id', GetSerieId(serieScope));
        },
        zIndex: 100
      });
    }
  };
});
