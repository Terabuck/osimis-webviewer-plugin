'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvImageViewport
 * @description
 * # wvImageViewport
 */
angular.module('osimiswebviewerApp')
.directive('wvImageViewport', ['orthanc', function(orthanc) {
return {
  scope: {
    wvImageId: '=',
    wvWidth: '=?', // default: auto ( fit to max(parent.width,image.width) )
    wvHeight: '=?', // default: auto ( fit to width*(1/ratio) )
    wvAutoResize: '=?', // resize on each image change - default: true
    wvOnInstanceChanged: '&?'
  },
  transclude: true,
  template: '<div style="position: relative">\
                <div class="cornerstone-enabled-image"\
                oncontextmenu="return false"\
                unselectable="on"\
                onselectstart="return false;"\
                onmousedown="return false;"\
              >\
                  <div oncontextmenu="return false" />\
                  <ng-transclude/>\
              </div>\
            </div>',
                  // <ng-transclude style="display: inline-block; position: absolute; top: 0; right: 0; bottom: 0; left: 0;"\
                  //   oncontextmenu="return false"\
                  //   unselectable="on"\
                  //   onselectstart="return false;"\
                  //   onmousedown="return false;"\
                  // />\
  restrict: 'E',
  replace: false,
  link: function postLink(scope, parentElement, attrs) {
      var _isLoaded = false;
      
      var jqElement = parentElement.children().children();
      var domElement = jqElement[0];
      var _image = null;

      cornerstone.enable(domElement);
      
      if (scope.wvImageId !== null && scope.wvImageId != undefined) {
        _displayImage(scope.wvImageId)
      }
      scope.$watch('wvImageId', _displayImage);

      scope.$watchGroup(['wvWidth', 'wvHeight'], _resize);

      if (scope.wvAutoResize === null || scope.wvAutoResize == undefined) {
        scope.wvAutoResize = true;
      }

      function _displayImage(wvImageId, old) {
        if (wvImageId == old) return;

        if (wvImageId === null || wvImageId == undefined) {
          return;
        }

        var imagePromise = cornerstone
        .loadAndCacheImage(wvImageId)
        .then(function(image) {
          _image = image;

          var csViewport = cornerstone.getViewport(domElement);
          cornerstone.displayImage(domElement, _image, csViewport);
          if (scope.wvAutoResize == true) {
            _resize([scope.wvWidth, scope.wvHeight]);
          }
  
          // load instance data
          orthanc
          .instance.getTags({id: _image.imageId})
          .$promise
          .then(function(tags) {
            scope.$broadcast('instance-loaded', tags);
          });

          if (!_isLoaded) {
            _onLoaded();
            _isLoaded = true;
          }

          // @todo: document the feature
          if (scope.wvOnInstanceChanged) {
            scope.wvOnInstanceChanged({
              $id: image.imageId
            });
          }
        });
        
        return imagePromise;
      }

      function _resize(newValues, old) {
        if (newValues == old) return;
        
        if (!_image) {
          return;
        }

        var wvWidth = newValues[0];
        var wvHeight = newValues[1];
        var width, height;

        // @todo prevent recursive call (http://jsfiddle.net/ubdr3ou5/)
        // @todo check scope is the last argument
        
        if (wvWidth === null || wvWidth == undefined) {
          wvWidth = 'auto';
        }
        if (wvHeight === null || wvHeight == undefined) {
          wvHeight = 'auto';
        }

        var ratio = _image.width/_image.height;
        if (wvWidth === 'auto' && wvHeight === 'auto') {
          // auto size width & width based on parent width
          var maxWidth = parentElement.parent().width();
          width = _image.width < maxWidth ? _image.width : maxWidth;
          height = width * (1/ratio);
          jqElement.width(Math.round(width));
          jqElement.height(Math.round(height));
        }
        else if (wvWidth !== 'auto' && wvHeight === 'auto') {
          // resize width & fit height based on wvWidth param
          var maxWidth = wvWidth;
          width = _image.width < maxWidth ? _image.width : maxWidth;
          height = width * (1/ratio);
          jqElement.width(Math.round(width));
          jqElement.height(Math.round(height));
        }
        else if (wvWidth === 'auto' && wvHeight !== 'auto') {
          // resize height && fit width based on wvHeightParam
          var maxHeight = wvHeight;
          height = _image.height < maxHeight ? _image.height : maxHeight;
          width = height * ratio;
          jqElement.width(Math.round(width));
          jqElement.height(Math.round(height));
        }
        else {
          jqElement.width(Math.round(wvWidth));
          jqElement.height(Math.round(wvHeight));
        }
        
        cornerstone.resize(domElement, true); // resize viewport
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
}]);
