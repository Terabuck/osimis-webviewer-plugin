/**
 * @ngdoc directive
 * @name webviewer.directive:wvOverlay
 * 
 * @restrict Element
 * @requires webviewer.directive:wvViewport
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvOverlay', wvOverlay);

    /* @ngInject */
    function wvOverlay() {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            replace: true, // avoid overlay capturing viewport events
            link: link,
            restrict: 'E',
            transclude: true,
            require: {
                series: '?^^vpSeriesId'
            },
            templateUrl: 'app/overlay/overlay.directive.html',
            scope: {
                'wvTags': '=?',
            	'wvSeries': '=?',
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

            // auto grab series model
            if (scope.vm.wvShowTimeline && ctrls.series) {
                var series = ctrls.series.getSeries();
                scope.vm.wvSeries = series;
                scope.vm.showTimeline = series && scope.vm.wvShowTimeline && !!series.imageCount;

                ctrls.series.onSeriesChanged(_this, function(series) {
                    scope.vm.wvSeries = series;
                    scope.vm.showTimeline = scope.vm.wvShowTimeline && series && series.imageCount > 1;
                });
                scope.$on('$destroy', function() {
                    ctrls.series.onSeriesChanged.close(_this);
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