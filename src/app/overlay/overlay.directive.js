(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvOverlay', wvOverlay);

    /* @ngInject */
    function wvOverlay() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            transclude: true,
            require: {
                serie: '?^^wvSerieId'
            },
            templateUrl: 'app/overlay/overlay.directive.html',
            scope: {
                'wvTags': '=?',
            	'wvSerie': '=?',
            	'wvViewport': '=?',
            	'wvShowTimeline': '=?'
            }
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;

            scope.vm.showTopLeftArea = function() {
                return !!scope.vm.wvTags;
            };
            scope.vm.showTopRightArea = function() {
                return !!scope.vm.wvTags &&
                    !!scope.vm.wvTags.SeriesDescription &&
                    !!scope.vm.wvTags.SeriesNumber;
            };
            scope.vm.showBottomRightArea = function() {
                return !!scope.vm.wvViewport && !!scope.vm.wvTags;
            };
            scope.vm.wvShowTimeline = typeof scope.vm.wvShowTimeline === 'undefined' ? true : scope.vm.wvShowTimeline;
            scope.vm.showTimeline = false;

            // auto grab serie model
            if (scope.vm.wvShowTimeline && ctrls.serie) {
                ctrls.serie.onSerieChanged(_this, function(serie) {
                    scope.vm.wvSerie = serie;
                    scope.vm.showTimeline = scope.vm.wvShowTimeline && !!serie.imageCount;
                });
                scope.$on('$destroy', function() {
                    ctrls.serie.onSerieChanged.close(_this);
                });
            }

            // function _onViewportData(viewport) {
            //     scope.$viewport = viewport;

            //     if (!viewport) {
            //       scope.showBottomRightArea = false;
            //     }
            //     else {
            //       scope.$viewport.scale = parseFloat(viewport.scale).toFixed(2);
            //       scope.$viewport.voi.windowWidth = parseFloat(viewport.voi.windowWidth).toFixed(0);
            //       scope.$viewport.voi.windowCenter = parseFloat(viewport.voi.windowCenter).toFixed(0);
            //       scope.showBottomRightArea = true;
            //     }
            // }
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();