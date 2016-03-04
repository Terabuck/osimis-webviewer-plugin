(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvAngleMeasureViewportTool', wvAngleMeasureViewportTool)
        .config(function($provide) {
            $provide.decorator('wvViewportDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvAngleMeasureViewportTool'] = '?^wvAngleMeasureViewportTool';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvAngleMeasureViewportTool($parse) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvAngleMeasureViewportTool',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var wvAngleMeasureViewportToolParser = $parse(attrs.wvAngleMeasureViewportTool);
            
            // bind attributes -> ctrl
            scope.$watch(wvAngleMeasureViewportToolParser, function(isActivated) {
                if (isActivated) {
                    ctrl.activate();
                }
                else {
                    ctrl.deactivate();
                }
            });

            // bind ctrl -> attributes
        }
    }

    /* @ngInject */
    function Controller($rootScope, $timeout, $, _, cornerstoneTools, debounce) {
        var _this = this;

        var _enabledElements = [];
        var _currentImage = null;

        this.toolName = 'angle';

        this.isActivated = false;
        
        this.register = function(enabledElement, currentImage) {
            _enabledElements.push(enabledElement);
            this.setCurrentImage(currentImage);

            if (this.isActivated) {
                _activateFor(enabledElement);
            }
        };
        this.setCurrentImage = function(image) {
            // close old image listeners
            var oldImage = _currentImage;
            if (oldImage) {
                oldImage.onAnnotationChanged.close(this);
            }
            
            // load tool data in cornerstone elements
            var data = image.getAnnotations(_this.toolName);
            if (data) {
                _updateAnnotations(image.id, data);
            }
            
            // listen to the new image
            image.onAnnotationChanged(this, function(type, data) {
                if (type !== _this.toolName) return;
                _updateAnnotations(image.id, data);
            });

            _currentImage = image;
        };
        this.unregister = function(enabledElement) {
            _.pull(_enabledElements, enabledElement);
        };

        this.activate = function() {
            _enabledElements.forEach(function (enabledElement) {
                _activateFor(enabledElement);
            });

            this.isActivated = true;
        };
        this.deactivate = function() {
            _enabledElements.forEach(function (enabledElement) {
                _deactivateFor(enabledElement);
            });

            this.isActivated = false;
        };
    
        function _activateFor(enabledElement) {
            var toolStateManager = cornerstoneTools.getElementToolStateManager(enabledElement);
            
            cornerstoneTools.mouseInput.enable(enabledElement);
            cornerstoneTools[_this.toolName].activate(enabledElement, true);
            
            // register data changes
            $(enabledElement).on('CornerstoneImageRendered.tool', debounce(function() {
                $timeout(function() {
                    // avoid having to use angular deep $watch
                    // using a fast shallow object clone
                    var data = _.clone(toolStateManager.getStateByToolAndImageId(_this.toolName, _currentImage.id));
                    _currentImage.onAnnotationChanged.ignore(_this, function() {
                        _currentImage.setAnnotations(_this.toolName, data);
                    });
                });
            }, 20));
        }

        function _deactivateFor(enabledElement) {
            $(enabledElement).off('.tool');

            cornerstoneTools[_this.toolName].deactivate(enabledElement);
            cornerstoneTools.mouseInput.disable(enabledElement);
        }

        function _updateAnnotations(imageId, data) {
            var toolName = _this.toolName;

            _enabledElements.forEach(function(enabledElement) {
                var toolStateManager = cornerstoneTools.getElementToolStateManager(enabledElement);
                toolStateManager.restoreStateByToolAndImageId(toolName, imageId, data);
            });
        }
    }
})();