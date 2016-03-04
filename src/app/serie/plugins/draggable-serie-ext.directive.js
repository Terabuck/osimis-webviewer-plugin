(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvDraggableSerieExt', wvDraggableSerieExt)
        .config(function($provide) {
            $provide.decorator('wvSerieIdDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvDraggableSerieExt'] = '?^wvDraggableSerieExt';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvDraggableSerieExt() {
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

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller($scope, $element, $attrs) {
        var _wvSerieIdViewModels = [];
        this.register = function(viewmodel) {
            _wvSerieIdViewModels.push(viewmodel);
        };
        this.unregister = function(viewmodel) {
            _.pull(_wvSerieIdViewModels, viewmodel);
        };

        var clone = $('<div class="wv-draggable-clone"></div>');
        $element.draggable({
            helper: function() {
                return clone;
            },
            start: function(evt, ui) {
                var serie = _wvSerieIdViewModels[0].getSerie();
                if (!serie) {
                    return;
                }

                var draggedElement = ui.helper;
                draggedElement.data('serie-id', serie.id);
                draggedElement.width($element.width());
                draggedElement.height($element.height());
            },
            zIndex: 100
        });

    }
})();
