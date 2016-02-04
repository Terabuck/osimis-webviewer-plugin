'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewportDroppable
 * @description
 * # wvViewportDroppable
 */

// require droppable
angular.module('webviewer')
  .directive('wvViewportDroppable', function () {
    return {
      scope: false,
      restrict: 'A',
      require: 'wvViewportSerie',
      link: function postLink(scope, element, attrs, serieViewportCtrl) {
        element.droppable({
          accept: '[wv-viewport-draggable]',
          drop: function(evt, ui) {
            var droppedElement = $(ui.helper);
            var serieId = droppedElement.data('serie-id');
            scope.$apply(function() {
              serieViewportCtrl.setSerie({id: serieId});
            });
          }
        });
      }
    };
  });
