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
    function wvDroppableSeriesExt() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
        }
    }

    /* @ngInject */
    function Controller($rootScope, $scope, $element) {
        var _wvSeriesIdViewModels = [];
        this.register = function(viewmodel) {
            _wvSeriesIdViewModels.push(viewmodel);
        };
        this.unregister = function(viewmodel) {
            _.pull(_wvSeriesIdViewModels, viewmodel);
        };

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
    }
})();