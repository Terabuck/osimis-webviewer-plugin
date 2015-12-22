'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewport
 * @description
 * # wvViewport
 */
angular.module('webviewer')
.directive('wvViewport', ['$q', 'orthancApiService', function($q, orthancApiService) {
return {
  scope: {
    wvInstance: '=?',
    wvWidth: '=?', // default: auto ( fit to max(parent.width,image.width) )
    wvHeight: '=?', // default: auto ( fit to width*(1/ratio) )
    wvEnableOverlay: '=?'
  },
  transclude: true,
  templateUrl: 'scripts/viewport/wv-viewport.tpl.html',
  restrict: 'E',
  replace: false,
  link: function postLink(scope, parentElement, attrs) {
      var jqElement = parentElement.children('.wv-cornerstone-enabled-image');
      var domElement = jqElement[0];
      cornerstone.enable(domElement);
      
      var _viewportChanged = 0;
      jqElement.on('CornerstoneImageRendered', function(evt, args) { // args.viewport & args.renderTimeInMs
        _viewportChanged++;
        scope.$evalAsync(function() {}); // trigger a new digest if needed
      });
      scope.$watch(function() {
        // this $watch is an important optimization to ensure
        // the event isn't triggered multiple times by digest.
        //
        // @note It would be better to simply ensure only one call of cornerstone.setViewport is
        // called by digest
        return _viewportChanged;
      }, function(_viewportChanged) {
        if (!_viewportChanged) return; // discard initial events
        var viewport = cornerstone.getViewport(domElement);
        scope.$broadcast('viewport:ViewportChanged', viewport);
      });

      var _image = null;
      var _adaptWindowingOnNextChange = false;
      var _adaptSizeOnNextChange = false;

      if (typeof scope.wvEnableOverlay === 'undefined') scope.wvEnableOverlay = true;

      scope.$on('viewport:SetInstance', function(evt, args) {
        _adaptWindowingOnNextChange = args.adaptWindowing || false;
        _adaptSizeOnNextChange = args.adaptSize || false;
        scope.wvInstance = args.id;
      });

      scope.$on('viewport:SetViewport', function(evt, strategy) {
        var viewport = cornerstone.getViewport(domElement);
        if (!viewport) return;
        viewport = strategy.execute(viewport);
        cornerstone.setViewport(domElement, viewport);

        scope.$broadcast('viewport:ViewportChanged', viewport);
      });

      scope.$on('viewport:ActivateTool', function(evt, args) {
        if (!_image) return;
        
        var name = args.tool;
        var args = args.arguments;

        var tool = cornerstoneTools[name];

        cornerstoneTools.mouseInput.enable(domElement);
        tool.activate.apply(tool, [domElement].concat(args));
      });
      scope.$on('viewport:DeactivateTool', function(evt, args) {
        if (!_image) return;

        var name = args.tool;

        var tool = cornerstoneTools[name];

        tool.deactivate(domElement);
        cornerstoneTools.mouseInput.disable(domElement);
      });
      
      scope.$watch('wvInstance', function(instanceId) {
        if (typeof instanceId === 'undefined' || instanceId === null) return;

        var promise = $q.all({
          image: cornerstone.loadAndCacheImage(instanceId),
          tags: orthancApiService.instance.getTags({id: instanceId}).$promise
        })
        .then(function(args) {
          var image = args.image;
          var tags = args.tags;
          
          var firstLoading = !_image ? true : false;
          _image = image;

          var viewport = cornerstone.getViewport(domElement);
          cornerstone.displayImage(domElement, _image, viewport);
          viewport = cornerstone.getViewport(domElement);
  
          if (_adaptWindowingOnNextChange) {
            viewport.voi.windowCenter = tags.WindowCenter;
            viewport.voi.windowWidth = tags.WindowWidth;
            cornerstone.setViewport(domElement, viewport);
            _adaptWindowingOnNextChange = false;
          }

          if (_adaptSizeOnNextChange) {
            _processResizeArgs([scope.wvWidth, scope.wvHeight]);
            _adaptSizeOnNextChange = false;
          }

          // @todo check http://dicomiseasy.blogspot.be/2013/06/getting-oriented-using-image-plane.html
          // var orientationValues = tags.ImageOrientationPatient.split('\\');
          // var orientationVector1 = orientationValues.slice(0, 3);
          // var orientationVector2 = orientationValues.slice(3);
          
          // @note transmit informations to overlay
          if (firstLoading) {
            if (!_adaptSizeOnNextChange) _processResizeArgs([scope.wvWidth, scope.wvHeight]);
            scope.$emit('viewport:ViewportLoaded');
          }
          scope.$broadcast('viewport:InstanceChanged', tags);
        });

      });

      scope.$watchGroup(['wvWidth', 'wvHeight'], _processResizeArgs);
      _processResizeArgs([scope.wvWidth, scope.wvHeight], [undefined, undefined]);

      // @todo listen to tools & states plugins (don't forget to somehow plug viewportChanged event)

      var _onWindowResize = null;
      function _processResizeArgs(newValues, old) {
        // reset window resizing event when resizing mode change
        if (_onWindowResize) {
          $(window).off('resize', _onWindowResize);
          _onWindowResize = null;
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

        if (wvWidth === 'auto' && wvHeight === 'auto') {
          if (!_image) return;
          // auto size width & height based on image width & height
          width = _image.width;
          height = _image.height;
        }
        else if (wvWidth !== 'auto' && wvHeight === 'auto') {
          // resize width & fit height based on wvWidth param
          if (!_image) return;
          var maxWidth = wvWidth;
          var ratio = _image.width/_image.height;
          width = _image.width < maxWidth ? _image.width : maxWidth;
          height = Math.round(width * (1/ratio));
        }
        else if (wvWidth === 'auto' && wvHeight !== 'auto') {
          // resize height && fit width based on wvHeightParam
          if (!_image) return;
          var maxHeight = wvHeight;
          var ratio = _image.width/_image.height;
          height = _image.height < maxHeight ? _image.height : maxHeight;
          width = Math.round(height * ratio);
        }
        else if (wvWidth === 'parent' && wvHeight === 'parent') { // @todo allow to use only one parent and not both
          var parentContainer = parentElement.closest('[wv-viewport-size]');

          if (!parentContainer.length) {
            return;
          }

          width = parentContainer.width();
          height = parentContainer.height();

          // adapt size when window resizes
          _onWindowResize = _.debounce(function() {
            // @note may induce bug if DOM structure changes before resizing (cf. parentContainer is cached)
            width = parentContainer.width();
            height = parentContainer.height();
            var viewport = _resize(width, height);
          }, 10);
          $(window).on('resize', _onWindowResize);
          scope.$on('$destroy', function() {
            if (_onWindowResize) {
              $(window).off('resize', _onWindowResize);
              _onWindowResize = null;
            }
          });
        }
        else {
          // @todo: document "you need to omit 'px'"
          width = wvWidth;
          height = wvHeight;
        }

        _resize(width, height);
      }
      
      function _resize(width, height) {
        var viewport;

        jqElement.width(width);
        jqElement.height(height);

        if (!_image) return;

        var fitToWindow = _image.width > width || _image.height > height;
        if (fitToWindow) {
          cornerstone.resize(domElement, true);
          viewport = cornerstone.getViewport(domElement);
        }
        else {
          cornerstone.resize(domElement, false);
          viewport = cornerstone.getViewport(domElement);
          viewport.scale = 1.0;
          cornerstone.setViewport(domElement, viewport);
        }

        return viewport;
      }
  }
};
}]);
