'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvImageViewport
 * @description
 * # wvImageViewport
 */
angular.module('osimiswebviewerApp')
.directive('wvImageViewport', function() {
  return {
    scope: {
      wvImageId: '='
    },
    template: '<div class="cornerstone-enabled-image"\
                oncontextmenu="return false"\
                unselectable="on"\
                onselectstart="return false;"\
                onmousedown="return false;"\
              >\
                  <div oncontextmenu="return false" />\
              </div>',
    restrict: 'E',
    replace: false,
    link: function postLink(scope, parentElement, attrs) {
      var _isLoaded = false;
      
      var jqElement = parentElement.children().children();
      var domElement = jqElement[0];

      cornerstone.enable(domElement);
      
      scope.$watch('wvImageId', _displayImage);
      if (scope.wvImageId !== null  && typeof scope.wvImageId !== 'undefined') {
        _displayImage(scope.wvImageId)
      }
      
      function _displayImage(wvImageId) {
        var imagePromise = cornerstone.loadAndCacheImage(wvImageId).then(function(image) {
          var csViewport = cornerstone.getViewport(domElement);
          cornerstone.displayImage(domElement, image, csViewport);

          if (!_isLoaded) {
            _onLoaded();
            _isLoaded = true;
          }
        });
        
        return imagePromise;
      }
      
      function _onLoaded() {
        // @todo $apply ? (not required now)
        jqElement.mousedown(function(e) {
          var lastX = e.pageX;
          var lastY = e.pageY;
          var mouseButton = e.which;
          
          $(document).mousemove(function(e) {
            var deltaX = e.pageX - lastX; 
            var deltaY = e.pageY - lastY;
            lastX = e.pageX;
            lastY = e.pageY;
            
            if (mouseButton == 1) { // ?
              var csViewport = cornerstone.getViewport(domElement);
              csViewport.voi.windowWidth += (deltaX / csViewport.scale);
              csViewport.voi.windowCenter += (deltaY / csViewport.scale);
              cornerstone.setViewport(domElement, csViewport);
            }
            else if (mouseButton == 2) { // move
              var csViewport = cornerstone.getViewport(domElement);
              csViewport.translation.x += (deltaX / csViewport.scale);
              csViewport.translation.y += (deltaY / csViewport.scale);
              cornerstone.setViewport(domElement, csViewport);
            }
            else if (mouseButton == 3) { // scale
              var csViewport = cornerstone.getViewport(domElement);
              csViewport.scale += (deltaY / 100);
              cornerstone.setViewport(domElement, csViewport);
            }
          });
          
          $(document).mouseup(function(e) {
            $(document).unbind('mousemove');
            $(document).unbind('mouseup');
          });
        });
      }
    }
  };
});
