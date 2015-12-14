'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportDroppable
 * @description
 * # wvViewportDroppable
 */

// require droppable
angular.module('osimiswebviewerApp')
  .directive('wvViewportDroppable', function () {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope();
        
        element.droppable({
          accept: '[wv-viewport-draggable]',
          drop: function(evt, ui) {
            var droppedElement = $(ui.helper);
            var serieId = droppedElement.data('serie-id');
            elementScope.$apply(function() {
              // @todo use more generic way than direct access to elementScope.wvSerieId
              elementScope.wvSerieId = serieId;
            });
          }
        });
      }
    };
  });
