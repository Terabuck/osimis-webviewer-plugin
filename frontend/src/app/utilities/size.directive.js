/**
 * @ngdoc directive
 *
 * @name webviewer.directive:wvSize
 * @restrict Attribute
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSize', wvSize);

    /* @ngInject */
    function wvSize($timeout, $parse, debounce) {
        /**
         * Generic directive to handle DOM element sizing via JS
         * Can be used by other directives
         */
        var directive = {
            controller: Controller,
            link: {
                pre: preLink
            },
            restrict: 'A',
            scope: false,
            require: 'wvSize',
            priority: 100
        };
        return directive;
    
        // preLink: make sure the element is watching its size only once it has been added to dom.
        function preLink(scope, element, attrs, ctrl) {
            if (!element.parent().length) return;

            var wvSize = $parse(attrs.wvSize);

            scope.$watch(wvSize, function (wvSize, old) {
                var width = wvSize.width;
                var height = wvSize.height;

                if (typeof width === 'undefined' || typeof height === 'undefined') {
                    return;
                }

                ctrl.updateSize(width, height);
            }, true);

            var whenWindowResizedFn = debounce(function() {
                scope.$apply(function() {
                    var size = wvSize(scope);
                    if (_isTag(size.width) || _isTag(size.height)) {
                        // the tagged element may have been resized by window resize if its size is defined in %
                        ctrl.updateSize(size.width, size.height);
                    }
                });
            }, 10);
            $(window).on('resize', whenWindowResizedFn);
            scope.$on('$destroy', function() {
                $(window).off('resize', whenWindowResizedFn);
            });
        }
    }

    /* @ngInject */
    function Controller(_, $parse, $scope, $attrs, $element) {
        var wvSize = $parse($attrs.wvSize);
        
        var _onUpdateListeners = [];

        this.onUpdate = function(fn) {
            _onUpdateListeners.push(fn);
            return function unlisten() {
                _.pull(_onUpdateListeners, fn);
            };
        };

        this.updateSize = function(width, height) {
            var _tag = null;

            var setWvSize = wvSize.assign;
            if (setWvSize) {
                setWvSize($scope, {
                    width: width,
                    height: height
                });

                // wvSize change triggers $digest wich trigger _this.updateSize() in $watch
                // @note might slow things down: wait next $digest..
            }
            
            if (_isTag(width)) {
                _tag = _tag || $element.closest('[wv-size-tag]');
                if (!_tag.length) throw new Error('wv-size#updateSize: [wv-size-tag] not found');
                // @note might cause reflow
                width = _tag.width() + 'px';
            }
            if (_isTag(height)) {
                _tag = _tag || $element.closest('[wv-size-tag]');
                if (!_tag.length) throw new Error('wv-size#updateSize: [wv-size-tag] not found');
                // @note might cause reflow
                height = _tag.height() + 'px';
            }

            if (_isSize(width) && _isSize(height)) {
                this.setSpecificWidthAndSpecificHeight(width, height);
            }
            else if (_isSize(width) && _isScale(height)) {
                this.setSpecificWidthAndScaleHeight(width, height);
            }
            else if (_isSize(height) && _isScale(width)) {
                this.setSpecificHeightAndScaleWidth(height, width);
            }
            else {
                throw new Error("wv-size: unsupported options");
            }
        };

        this.setWidth = function(width) {
            var height = wvSize($scope).height;
            this.updateSize(width, height);
        };

        this.setHeight = function(height) {
            var width = wvSize($scope).width;
            this.updateSize(width, height);
        };

        this.getWidthInPixel = function() {
            var width = wvSize($scope).width;
            if (_isInPixels(width)) {
                return +width.replace('px', '');
            }
            else {
                // @note trigger reflow !
                return +$element.width();
            }
        };
        this.getHeightInPixel = function() {
            var height = wvSize($scope).height;
            if (_isInPixels(height)) {
                return +height.replace('px', '');
            }
            else {
                // @note trigger reflow !
                return +$element.height();
            }
        };

        this.setSpecificWidthAndSpecificHeight = function(width, height) {
            $element.css('width', width);
            $element.css('height', height);

            _onUpdateListeners.forEach(function(listener) {
                listener();
            });
        }

        this.setSpecificWidthAndScaleHeight = function(width, heightScale) {
            var height = width.replace(/^([0-9]+)(\w+)$/, function(match, width, unit) {
                return (width * heightScale) + unit;
            });
            $element.css('width', width);
            $element.css('height', height);

            _onUpdateListeners.forEach(function(listener) {
                listener();
            });
        }

        this.setSpecificHeightAndScaleWidth = function(height, widthScale) {
            var width = height.replace(/^([0-9]+)(\w+)$/, function(match, height, unit) {
                return (height * widthScale) + unit;
            });
            $element.css('height', height);
            $element.css('width', width);

            _onUpdateListeners.forEach(function(listener) {
                listener();
            });
        }
    }

    function _isSize(size) {
        return _.isString(size) && size.match(/^[0-9]+\w+$/);
    }

    function _isScale(size) {
        return _.isNumber(size);
    }

    function _isTag(size) {
        return _.isString(size) && size === '[wv-size-tag]';
    }

    function _isInPixels(size) {
        return _.isString(size) && size.match(/^[0-9]+(px)?$/);
    }

})();