/**
 * @ngdoc directive
 * @name webviewer.directive:wvDroppableSeriesExt
 * 
 * @param {boolean} [wvDroppableSeriesExt=true] Makes the viewport droppable.
 * 
 * @restrict A
 * @requires webviewer.directive:wvViewport
 * @requires webviewer.directive:vpSeriesId
 * 
 * @description
 * The `wvDroppableSeriesExt` directive let the end-user drop a series on a
 * viewport. It is to be used in conjunction with `wvDraggableSeriesExt` which
 * is mostly used with the `wvSerieslist`.
 **/
 (function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvDroppableSeriesExt', wvDroppableSeriesExt)
        .config(function($provide) {
            $provide.decorator('vpSeriesIdDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvDroppableSeriesExt'] = '?^wvDroppableSeriesExt';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvDroppableSeriesExt($parse) {
        var directive = {
            require: 'wvDroppableSeriesExt',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs, tool) {
            // Switch activate/deactivate based on databound HTML attribute
            var wvDroppableSeriesExtParser = $parse(attrs.wvDroppableSeriesExt);
            scope.$watch(wvDroppableSeriesExtParser, function(isActivated) {
                if (isActivated) {
                    tool.activate();
                }
                else {
                    tool.deactivate();
                }
            });
        }
    }

    /* @ngInject */
    function Controller($rootScope, $scope, $element) {
        var _wvSeriesIdViewModels = [];
        
        // @todo Enhance class hierarchy/separate concerns w/ 
        // the `BaseTool` class. Note `BaseTool` extends instances of 
        // `wvViewport` directives whereas this directive extends `vpSeriesId`.

        // Make the element droppable (override base activate method).
        $element.droppable({
            accept: '[wv-draggable-series-ext]',
            drop: function(evt, ui) {
                var droppedElement = $(ui.helper);
                var seriesId = droppedElement.data('series-id');
                $scope.$apply(function() {
                    _wvSeriesIdViewModels.forEach(function(viewmodel) {
                        viewmodel
                            // Set new series
                            .setSeries(seriesId)

                            // Reset properties once series loaded.
                            .then(function(series) {
                                // Reset cornerstone viewport data.
                                // No need to call `#draw` as goToImage will do the redraw.
                                var viewport = viewmodel.getViewport();

                                viewport.onImageChanging.once(function() {
                                    viewport.reset();
                                });
                                
                                // Reset image index (go to the first image )
                                series.goToImage(0);
                            });
                    });
                });
            }
        });

        // Keep track of the series-id model
        this.register = function(viewmodel) {
            _wvSeriesIdViewModels.push(viewmodel);
        };
        this.unregister = function(viewmodel) {
            _.pull(_wvSeriesIdViewModels, viewmodel);
        };

        // Activate/deactivate the `drop` feature.
        this.activate = function() {
            $element.droppable('enable');
        };
        this.deactivate = function() {
            $element.droppable('disable');
        };
    }
})();