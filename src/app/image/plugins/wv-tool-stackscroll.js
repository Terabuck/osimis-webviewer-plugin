'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolStackscroll
 * @description
 * # wvToolStackscroll
 */
angular.module('webviewer')
.directive('wvToolStackscroll', function($, _, $parse) {
return {
  scope: false,
  restrict: 'A',
  link: function postLink(scope, element, attrs) {
    // @ TODO !
    var elementScope = angular.element(element).isolateScope();
    
    var handler = function(e) {
      var lastX = e.pageX;
      var lastY = e.pageY;
      var mouseButton = e.which;

      var updateInstance = _.debounce(function(e) {
        var deltaX = e.pageX - lastX; 
        var deltaY = e.pageY - lastY;
        lastX = e.pageX;
        lastY = e.pageY;

        elementScope.$apply(function() {
          if (mouseButton === 1 && deltaX > 0) {
            elementScope.wvInstanceIndex++;

            // elementScope.$broadcast('viewport-command', strategy);
          }
          else if (mouseButton === 1 && deltaX < 0) {
            elementScope.wvInstanceIndex--;
          }
        });
      }, 17); // @todo use something working
      
      $(document).mousemove(function(e) {
        updateInstance(e);

        $(document).mouseup(function(e) {
          // @todo make safer
          $(document).unbind('mousemove');
          $(document).unbind('mouseup');
          e.stopImmediatePropagation();
          e.preventDefault();
        });
        e.stopImmediatePropagation();
        e.preventDefault();
      });
      
    };

    scope.$watch(attrs.wvToolStackscroll, function(wvToolStackscroll) {
      if (wvToolStackscroll) element.on('mousedown', handler);
      else element.off('mousedown', handler);
    });
  }
};
});
