(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvDroppableSeriesExt', wvDroppableSeriesExt)
        .config(function($provide) {
            $provide.decorator('wvSeriesIdDirective', function($delegate) {
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
                        // Trigger old series removed UX global event
                        var oldSeries = viewmodel.getSeries();
                        if (oldSeries) {
                            $rootScope.$emit('UserUnSelectedSeriesId', oldSeries.id);
                        }

                        // Set new series
                        viewmodel
                            .setSeries(seriesId)
                            .then(function(newSeries) {
                                // Trigger new series UX global event
                                if (newSeries) {
                                    $rootScope.$emit('UserSelectedSeriesId', seriesId);
                                }
                            });
                    });
                });
            }
        });
    }
})();