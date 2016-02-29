(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvViewport', wvViewport);

    /* @ngInject */
    function wvViewport($, _, cornerstone, cornerstoneTools, $q, $parse, wvImageRepository) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            transclude: true,
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            templateUrl: 'app/image/viewport.directive.tpl.html',
            link: link,
            restrict: 'E',
            require: ['wvViewport', '?wvSize'],
            scope: {
                wvImageId: '=?',
                // wvImage: '=?',
                wvTags: '=?',
                wvViewport: '=?',
                wvEnableOverlay: '=?'
            }
        };
        return directive;

        /**
         * responsibility: manage directive's information flow
         * 
         * dataflows: 
         *   directive's controller
         *     [command] -> controller -> attributes/$scope -> viewmodel -> cornerstone API -> [dom]
         *     [request] <- controller <- attributes/$scope <- viewmodel <- [out]
         *   directive's attributes
         *     [command] -> attributes/$scope -> viewmodel -> cornerstone API -> [dom]
         *     [request] <- attributes/$scope <- viewmodel <- [out]
         *   wv-size dependency
         *     [update] -> viewmodel -> cornerstone API -> [dom]
         */
        function link(scope, element, attrs, ctrls) {
            var enabledElement = element.children('.wv-cornerstone-enabled-image')[0];
            var model = new ViewportViewModel($q, wvImageRepository, enabledElement);
            var _resetConfigOnImageChange = false;

            scope.vm.wvEnableOverlay = !!scope.vm.wvEnableOverlay;
            var wvImageIdParser = $parse(attrs.wvImageId);

            // bind directive's sizing (via wv-size controller) to cornerstone
            {
                var wvSizeCtrl = ctrls[1];
                var unbindWvSize = _bindWvSizeController(wvSizeCtrl, model);
            }

            // bind directive's controller to cornerstone (via directive's attributes)
            {
                var ctrl = ctrls[0];
                ctrl.getImage = function() {
                    return model.getImageId();
                };
                ctrl.setImage = function(id, resetConfig) {
                    scope.vm.wvImageId = id;

                    if (resetConfig) {
                        var oldResetConfig = _resetConfigOnImageChange;
                        _resetConfigOnImageChange = true;
                        model.onImageChanged.once(function() {
                            _resetConfigOnImageChange = oldResetConfig;
                        });
                    }
                };
                ctrl.clearImage = function() {
                    scope.vm.wvImageId = null;
                };
            }

            // bind directive's attributes to cornerstone
            {
                scope.$watch('vm.wvImageId', function (wvImageId, old) {
                    if (!wvImageId) {
                        model.clearImage();
                    }
                    else {
                        model.setImage(wvImageId, _resetConfigOnImageChange || false);
                    }
                });
            }

            // bind model to directive's attributes
            // bind tags
            model.onImageChanged(function(image) {
                scope.vm.wvTags = image.tags;
            });
            element.on('CornerstoneImageRendered', function(evt, args) { // element.off not needed
                scope.$evalAsync(function() { // trigger a new digest if needed
                    scope.vm.wvViewport = args.viewport;
                });
            });
            // cornerstone.
                // bind cornerstone viewport
                // scope.vm.wvViewport

            // unlisten binds
            scope.$on('$destroy', function() {
                if (unbindWvSize) {
                    unbindWvSize();
                    unbindWvSize = null;
                }
                model.destroy();
            });

            function _bindWvSizeController(wvSizeController, model) {
                if (!wvSizeController) {
                    model.resizeViewport(element.width(), element.height());
                    return null;
                }

                //model.resizeViewport(wvSizeController.getWidthInPixel(), wvSizeController.getHeightInPixel());
                var unlistenWvSizeFn = wvSizeController && wvSizeController.onUpdate(function() {
                    var width = wvSizeController.getWidthInPixel();
                    var height = wvSizeController.getHeightInPixel();

                    model.resizeViewport(width, height);
                    
                    if (model.hasImage()) {
                        model.autoScaleImage();
                    }
                });

                return function unbind() {
                    unlistenWvSizeFn();
                }
            }
        }
    }

    /**
     * responsibility: manage inter-directive communications
     *
     * @ngInject
     */
    function Controller($scope, $element, cornerstone, wvImageRepository) {
        this.getImage = angular.noop;
        this.setImage = angular.noop;
        this.clearImage = angular.noop;
    }

    /**
     * responsibility: manage cornerstone viewport
     */
    function ViewportViewModel($q, wvImageRepository, enabledElement) {
        this._$q = $q;
        this._imageRepository = wvImageRepository;
        this._enabledElement = enabledElement;
        
        this._imageId = null;
        this._viewportWidth = null;
        this._viewportHeight = null;

        this.onImageChanged = new osimis.Listener();

        this.init();
    }

    ViewportViewModel.prototype.onImageChanged = angular.noop;
    ViewportViewModel.prototype.init = function() {
        cornerstone.enable(this._enabledElement);
    };
    ViewportViewModel.prototype.destroy = function() {
        cornerstone.disable(this._enabledElement);
    };

    ViewportViewModel.prototype.getImageId = function() {
        return this._imageId;
    };
    ViewportViewModel.prototype.setImage = function(id, resetConfig) {
        var _this = this;
        var doAutoScaleImage = this._imageId === null ? true : false; // don't override actual viewport configuration
        resetConfig = resetConfig || false;

        this._imageId = id;

        var pixelsLoading = cornerstone
            .loadImage('orthanc://' + id)
            .then(function(processedImage) {
                if (!resetConfig) {
                    cornerstone.displayImage(_this._enabledElement, processedImage);
                }
                else {
                    var viewport = cornerstone.getDefaultViewportForImage(_this._enabledElement, processedImage);
                    cornerstone.displayImage(_this._enabledElement, processedImage, viewport);
                }
            })
            .then(function() {
                if (doAutoScaleImage) {
                    _this.autoScaleImage();
                }
                
                $(_this._enabledElement).css('visibility', 'visible');
            });

        var modelLoading = this._imageRepository
            .get(id);

        this._$q
            .all([pixelsLoading, modelLoading])
            .then(function(args) {
                var imageModel = args[1];

                _this.onImageChanged.trigger(imageModel);
            })
    }
    ViewportViewModel.prototype.clearImage = function() {
        this._imageId = null;

        //cornerstone.displayImage(this._enabledElement, null);
        $(this._enabledElement).css('visibility', 'hidden');
    };
    ViewportViewModel.prototype.hasImage = function() {
        return this._imageId !== null;
    }

    ViewportViewModel.prototype.resizeViewport = function(width, height) {
        var jqEnabledElement = $(this._enabledElement);

        this._viewportWidth = width;
        this._viewportHeight = height;

        jqEnabledElement.width(width);
        jqEnabledElement.height(height);
        cornerstone.resize(this._enabledElement, false);
    };
    
    ViewportViewModel.prototype.autoScaleImage = function() {
        var csImage = cornerstone.getImage(this._enabledElement);

        var isImageSmallerThanViewport = csImage.width <= this._viewportWidth && csImage.height <= this._viewportHeight;
        if (isImageSmallerThanViewport) {
            cornerstone.resize(this._enabledElement, false);
            var viewport = cornerstone.getViewport(this._enabledElement);
            viewport.scale = 1.0;
            cornerstone.setViewport(this._enabledElement, viewport);
        }
        else {
            cornerstone.fitToWindow(this._enabledElement);
        }
    };

})();


//'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvImage
 * @description
 * # wvImage
 */
/*
angular.module('webviewer')
.directive('wvImage', function($, _, cornerstone, cornerstoneTools, $q, orthancApiService) {
return {
  scope: {
    wvModel: '=?',
    wvWidth: '=?', // default: auto ( fit to max(parent.width,image.width) )
    wvHeight: '=?' // default: auto ( fit to width*(1/ratio) )
  },
  require: ['wvImage', 'wvSize'],
  transclude: true,
  templateUrl: 'app/serie/image.directive.html',
  restrict: 'E',
  replace: false,
  controller: function($scope) {
    var _domElement;
    this.setDomElement = function(dom) {
      _domElement = dom;
    };
    this.setViewport = function(strategy) {
      var viewport;

      try {
        viewport = cornerstone.getViewport(_domElement);        
      } catch(ex) {
        return;
      }

      if (!viewport) return;
      viewport = strategy.execute(viewport);
      cornerstone.setViewport(_domElement, viewport);

      $scope.$broadcast('viewport:ViewportChanged', viewport);
    };
  },
  link: function postLink(scope, parentElement, attrs, ctrls) {
      var ctrl = ctrls[0];
      var jqElement = parentElement.children('.wv-cornerstone-enabled-image');
      var domElement = jqElement[0];
      cornerstone.enable(domElement);
      ctrl.setDomElement(domElement);
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

      var _processedImage = null;
      var _adaptWindowingOnNextChange = false;
      var _adaptSizeOnNextChange = false;

      if (typeof scope.wvEnableOverlay === 'undefined') scope.wvEnableOverlay = true;

      scope.wvInstance = scope.wvInstance || {};
      scope.$watch('wvInstance', function(wvInstance) {
        if (typeof wvInstance !== 'object') {
          scope.wvInstance = {
            id: wvInstance
          };
        }
      });
  
      //scope.$on('viewport:SetInstance', function(evt, args) {});
      // @todo move in controller
      ctrl.setInstance = function(args) {
        _adaptWindowingOnNextChange = args.adaptWindowing || false;
        _adaptSizeOnNextChange = args.adaptSize || false;
        scope.wvInstance.id = args.id;
      };

      scope.$on('viewport:GetInstanceData', function(evt, fn) {
        fn(scope.wvInstance.tags);
      });

      scope.$on('viewport:GetViewportData', function(evt, fn) {
        var viewport = cornerstone.getViewport(domElement);
        fn(viewport);
      });
      scope.$on('viewport:SetViewport', function(evt, strategy) {
        ctrl.setViewport(strategy);
      });

      scope.$on('viewport:ActivateTool', function(evt, args) {
        if (!_processedImage) return;
        
        var name = args.tool;
        var opts = args.arguments;

        var tool = cornerstoneTools[name];

        cornerstoneTools.mouseInput.enable(domElement);
        tool.activate.apply(tool, [domElement].concat(opts));
      });
      scope.$on('viewport:DeactivateTool', function(evt, args) {
        if (!_processedImage) return;

        var name = args.tool;

        var tool = cornerstoneTools[name];

        tool.deactivate(domElement);
        cornerstoneTools.mouseInput.disable(domElement);
      });
  
      domElement.ctrl = ctrl;
      scope.$on('viewport:ListenDomEvent', function(evt_, args) {
        var evt = args.evt;
        var fn = args.fn;
        
        jqElement.on(evt, fn);
      });
      scope.$on('viewport:UnlistenDomEvent', function(evt_, args) {
        var evt = args.evt;
        var fn = args.fn;

        jqElement.off(evt, fn);
      });
      
      scope.$watch('wvInstance.id', function(instanceId) {
        if (typeof instanceId === 'undefined' || instanceId === null) return;

        var promise = $q.all({
          image: cornerstone.loadAndCacheImage(instanceId),
          tags: orthancApiService.instance.getTags({id: instanceId}).$promise
        })
        .then(function(args) {
          var image = args.image;
          var tags = args.tags;
          
          var firstLoading = !_processedImage ? true : false;
          _processedImage = image;
          scope.wvInstance.tags = tags;

          var viewport = cornerstone.getViewport(domElement);
          cornerstone.displayImage(domElement, _processedImage, viewport);
          viewport = cornerstone.getViewport(domElement);
  
          if (_adaptWindowingOnNextChange) {
            viewport.voi.windowCenter = tags.WindowCenter;
            viewport.voi.windowWidth = tags.WindowWidth;
            cornerstone.setViewport(domElement, viewport);
            _adaptWindowingOnNextChange = false;
          }

          if (_adaptSizeOnNextChange) {
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

      // @todo listen to tools & states plugins (don't forget to somehow plug viewportChanged event)
  }
};
});
*/