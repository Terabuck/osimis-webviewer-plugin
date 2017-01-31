(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvDraggableSeriesExt', wvDraggableSeriesExt)
        .config(function($provide) {
            $provide.decorator('vpSeriesIdDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvDraggableSeriesExt'] = '?^wvDraggableSeriesExt';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvDraggableSeriesExt() {
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
        var _wvSeriesIdViewModels = [];
        this.register = function(viewmodel) {
            _wvSeriesIdViewModels.push(viewmodel);
        };
        this.unregister = function(viewmodel) {
            _.pull(_wvSeriesIdViewModels, viewmodel);
        };

        var clone = $('<div class="wv-draggable-clone"></div>');
        $element.draggable({
            // Make sure the dragged element is visible everywhere in the app
            helper: function() {
                return clone;
            },
            appendTo: 'body',
            // Set dragged element data information to be retrieved by the 
            // `wvDroppableSeriesExt`.
            start: function(evt, ui) {
                var series = _wvSeriesIdViewModels[0].getSeries();
                if (!series) {
                    return;
                }

                var draggedElement = ui.helper;
                draggedElement.data('series-id', series.id);
                draggedElement.width($element.width());
                draggedElement.height($element.height());
            },
            zIndex: 100
        });

    }
})();
