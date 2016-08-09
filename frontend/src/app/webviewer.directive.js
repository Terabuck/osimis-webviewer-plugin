/**
 * @ngdoc
 *
 * @name wvWebviewer
 *
 * @description
 * The `wvWebviewer` directive display a whole web viewer at full scale (100% width, 100% height).
 *
 * @scope
 * 
 * @restrict E
 *
 * @param {boolean} wvToolbarEnabled (optional) Display the toolbar
 *   Note all tools are disabled when the toolbar is disabled, including the preselected ones (windowing & zooming).
 *
 * @param {boolean} wvStudylistEnabled (optional) Show a list of study to let the user choose the `wv-study-id`.
 *   `wvSerieslistEnabled` must be true.
 *
 * @param {string} wvStudyId (optional) Configure the study shown in the serieslist
 *   `wvSerieslistEnabled` must be true.
 *
 * @param {boolean} wvSerieslistEnabled (optional) Display the list of series
 *   Used to show the list of series of `wv-study-id`.
 *   Either `wvStudyId` has to be defined or wv-studylist-enabled` has to be true.
 *
 * @param {string} wvSeriesId (optional) Configure the series shown in the main viewport
 *
 * @param {object} wvTools (optioanl) Configure the displayed tools with their default vaule
 *   See source code for available configuration options.
 *
 * @example
 * The following example show the toolbar, hide the full list of studies,
 * and display a list of draggable series with a splitable pane of droppable
 * viewports.
 * ```html
 * <wv-webviewer
 *     wv-studylist-enabled="false"
 *     wv-toolbar-enabled="true"
 *     
 *     wv-study-id="'your-study-id'"
 *     wv-serieslist-enabled="true" 
 * ></wv-webviewer>
 * ```
 **/
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvWebviewer', wvWebviewer);

    /* @ngInject */
    function wvWebviewer($rootScope) {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                toolbarEnabled: '=?wvToolbarEnabled',
                studylistEnabled: '=?wvStudylistEnabled',
                studyId: '=?wvStudyId',
                serieslistEnabled: '=?wvSerieslistEnabled',
                seriesId: '=?wvSeriesId',
                tools: '=?wvTools'
            },
            templateUrl: 'app/webviewer.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            // Configure attributes default values
            vm.toolbarEnabled =  typeof vm.toolbarEnabled !== 'undefined' ? vm.toolbarEnabled : true;
            vm.studylistEnabled = typeof vm.studylistEnabled !== 'undefined' ? vm.studylistEnabled : true;
            vm.serieslistEnabled = typeof vm.serieslistEnabled !== 'undefined' ? vm.serieslistEnabled : true;
            vm.tools = typeof vm.tools !== 'undefined' ? vm.tools : {
                windowing: true,
                zoom: false,
                pan: false,
                invert: false,
                lengthmeasure: false,
                anglemeasure: false,
                pixelprobe: false,
                ellipticalroi: false,
                rectangleroi: false,
                layout: !vm.serieslistEnabled ? undefined : {
                    x: 1,
                    y: 1
                },
                play: false,
                overlay: true,
                vflip: false,
                hflip: false,
                rotateleft: false,
                rotateright: false
            };

            // Change over these scope variables will in most case change the layout, including the
            // size of the viewport. Therefore, the viewport must be resized. We trigger $(window).resize()
            // for this reason.
            scope.$watchGroup([
                'vm.toolbarEnabled',
                'vm.studylistEnabled',
                'vm.serieslistEnabled'
            ], function() {
                // we use $evalAsync instead of timeout since it does not trigger reflow
                scope.$evalAsync(function() {
                    $(window).resize();
                });
            });

            // Configure preloading
            // @todo add on-series-dropped callback and move out the rest of the events from wv-droppable-series.
            scope.$watch('vm.seriesId', function(newSeriesId, oldSeriesId) {
                // Cancel previous preloading
                if (oldSeriesId && newSeriesId !== oldSeriesId) {
                    $rootScope.$emit('UserUnSelectedSeriesId', oldSeriesId);
                }

                // Preload series
                if (newSeriesId) {
                    $rootScope.$emit('UserSelectedSeriesId', newSeriesId);
                }
            });
            scope.$watch('vm.studyId', function(newStudyId, oldStudyId) {
                // Cancel previous preloading
                if (oldStudyId && newStudyId !== oldStudyId) {
                    $rootScope.$emit('UserUnSelectedStudyId', oldStudyId);
                }

                // Preload study
                if (newStudyId) {
                    $rootScope.$emit('UserSelectedStudyId', newStudyId);
                }
            });

            // Configure viewports by index
            vm.viewports = [];
            vm.configureViewport = function(index) {
                vm.viewports[index] = {
                    seriesId: vm.seriesId
                };
            };
            vm.cleanupViewport = function(index) {
                vm.viewports[index] = undefined; // don't use splice since it changes the indexes from the array
            };
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();