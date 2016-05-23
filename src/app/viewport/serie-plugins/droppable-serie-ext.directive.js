(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvDroppableSerieExt', wvDroppableSerieExt)
        .config(function($provide) {
            $provide.decorator('wvSerieIdDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvDroppableSerieExt'] = '?^wvDroppableSerieExt';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvDroppableSerieExt() {
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
        var _wvSerieIdViewModels = [];
        this.register = function(viewmodel) {
            _wvSerieIdViewModels.push(viewmodel);
        };
        this.unregister = function(viewmodel) {
            _.pull(_wvSerieIdViewModels, viewmodel);
        };

        $element.droppable({
            accept: '[wv-draggable-serie-ext]',
            drop: function(evt, ui) {
                var droppedElement = $(ui.helper);
                var serieId = droppedElement.data('serie-id');
                $scope.$apply(function() {
                    _wvSerieIdViewModels.forEach(function(viewmodel) {
                        // Trigger old series removed UX global event
                        var oldSerie = viewmodel.getSerie();
                        if (oldSerie) {
                            $rootScope.$emit('UserUnSelectedSeries', oldSerie);
                        }

                        // Set new serie
                        viewmodel
                            .setSerie(serieId)
                            .then(function(newSerie) {
                                // Trigger new series UX global event
                                if (newSerie) {
                                    $rootScope.$emit('UserSelectedSeries', newSerie);
                                }
                            });
                    });
                });
            }
        });
    }
})();