'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportMouseEvents
 * @description
 * # wvViewportMouseEvents
 */
angular.module('osimiswebviewerApp')
.directive('wvViewportMouseEvents', function () {
return {
  /** scope:
   * wvValuesOfInterest = {windowWidth, windowCenter}
   * wvTranslation = {x, y}
   * wvScaling = x.f
   */
  scope: false,
  restrict: 'A',
  link: function postLink(scope, parentElement, attrs, ctrl) {
    var jqElement = parentElement;

    // @todo wait for onloaded ?

    var elementScope = angular.element(parentElement).isolateScope(); // @todo DO THAT BETTER BOY!

    jqElement.mousedown(function(e) {
      var lastX = e.pageX;
      var lastY = e.pageY;
      var mouseButton = e.which;
      
      $(document).mousemove(function(e) {
        elementScope.$apply(function() {  // @todo necessary ?
          var deltaX = e.pageX - lastX; 
          var deltaY = e.pageY - lastY;
          lastX = e.pageX;
          lastY = e.pageY;
          
          if (mouseButton == 1) { // left-click + move -> windowing
            var strategy = {
              execute: function (viewport) {
                var scale = viewport.scale;
                viewport.voi.windowWidth = +viewport.voi.windowWidth + (this.deltaX / scale);
                viewport.voi.windowCenter = +viewport.voi.windowCenter + (this.deltaY / scale);
                return viewport;
              },
              deltaX: deltaX,
              deltaY: deltaY
            };

            elementScope.$broadcast('viewport:SetViewport', strategy);
          }
          else if (mouseButton == 2) { // middle-click + move -> moving
            var strategy = {
              execute: function (viewport) {
                var scale = viewport.scale;
                viewport.translation.x = +viewport.translation.x + (this.deltaX / scale);
                viewport.translation.y = +viewport.translation.y + (this.deltaY / scale);
                return viewport;
              },
              deltaX: deltaX,
              deltaY: deltaY
            };

            elementScope.$broadcast('viewport:SetViewport', strategy);
          }
          else if (mouseButton == 3) { // right-click + move -> scaling
            var strategy = {
              execute: function (viewport) {
                viewport.scale = +viewport.scale + (this.deltaY / 100);
                return viewport;
              },
              deltaY: deltaY
            };

            elementScope.$broadcast('viewport:SetViewport', strategy);
          }
        });
        
        $(document).mouseup(function(e) {
          // @todo make safer
          $(document).unbind('mousemove');
          $(document).unbind('mouseup');
        });
      });
    });
  }
};
});
