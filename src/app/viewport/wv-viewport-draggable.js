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
    require: '?wvViewportSerie',
    link: function postLink(scope, element, attrs, serieCtrl) {
      // @todo use directive communication w/ angular require instead 'coz this directive is dependant
      var serieScope = scope;

      var getSerieId;
      if (serieCtrl) { // @todo use more generic method
        getSerieId = function() { return serieCtrl.id; }; // method taking a scope as the param
      }
      else {
        getSerieId = function() {
          var _id;
          scope.$broadcast('serie:GetSerieId', function(id) {
            _id = id;
          });
          return _id;
        };
      }

      // @todo style
      var clone = $('<div class="wv-draggable-clone"></div>');
      element.draggable({
        helper: function() {
          return clone;
        },
        start: function(evt, ui) {
          var draggedElement = ui.helper;
          draggedElement.data('serie-id', getSerieId(serieScope));
          draggedElement.width(element.width());
          draggedElement.height(element.height());
        },
        zIndex: 100
      });
    }
  };
});
