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
    function Controller($scope, $element) {
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
                        viewmodel.setSerie(serieId);
                    });
                });
            }
        });
    }
})();