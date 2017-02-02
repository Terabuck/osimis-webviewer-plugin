/**
 * @ngdoc directive
 * @name webviewer.directive:wvWebviewer
 *
 * @param {boolean} [wvToolbarEnabled] Display the toolbar
 *   Note all tools are disabled when the toolbar is disabled, including the
 *   preselected ones (windowing & zooming).
 *
 * @param {boolean} [wvStudylistEnabled] Show a list of study to let the user
 *   choose the `wv-study-id`. `wvSerieslistEnabled` must be true.
 *   
 *
 * @param {string} [wvStudyId] Configure the study shown in the serieslist
 *   `wvSerieslistEnabled` must be true.
 *
 * @param {boolean} [wvSerieslistEnabled] Display the list of series
 *   Used to show the list of series of `wv-study-id`.
 *   Either `wvStudyId` has to be defined or wv-studylist-enabled` has to be
 *   true.
 *
 * @param {string} [wvSeriesId] Configure the series shown in the main viewport
 *
 * @param {object} [wvTools] Configure the displayed tools with their default 
 *   value. See source code for available configuration options.
 * 
 * @scope
 * @restrict Element
 *
 * @description
 * The `wvWebviewer` directive displays a whole web viewer at full scale (100%
 * width, 100% height).
 * 
 * @example
 * The following example shows the toolbar, hide the full list of studies,
 * and display a list of draggable series with a splitable pane of droppable
 * viewports.
 * 
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
    function wvWebviewer($rootScope, wvMobileCompatibility) {
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
            vm.toolbarEnabled = typeof vm.toolbarEnabled !== 'undefined' ? vm.toolbarEnabled : wvMobileCompatibility.toolbarEnabled;
            vm.studylistEnabled = typeof vm.studylistEnabled !== 'undefined' ? vm.studylistEnabled : true;
            vm.serieslistEnabled = typeof vm.serieslistEnabled !== 'undefined' ? vm.serieslistEnabled : true;
            vm.tools = typeof vm.tools !== 'undefined' ? vm.tools : {
                pan: true,
                zoom: false,
                windowing: false,
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

            // Store each viewports' states at this level
            // so they can be either later changed by external means (ie. Lify want to retrieve
            // which series is being seen for analysis) or saved for liveshare for instance. 
            vm.viewports = [];
            vm.configureViewport = function(index) {
                vm.viewports[index] = {
                    seriesId: vm.seriesId,
                    csViewport: {},
                    imageIndex: 0
                };
            };
            vm.cleanupViewport = function(index) {
                vm.viewports[index] = undefined; // don't use splice since it changes the indexes from the array
            };

            // Preload studies
            scope.$watch('vm.studyId', function(newStudyId, oldStudyId) {
                // Log study id
                console.log('Study: ', newStudyId);

                // Cancel previous preloading
                if (oldStudyId && newStudyId !== oldStudyId) {
                    $rootScope.$emit('UserUnSelectedStudyId', oldStudyId);
                }

                // Preload study
                if (newStudyId) {
                    $rootScope.$emit('UserSelectedStudyId', newStudyId);
                }
            });

            // Propagate series preloading events
            // @todo Add on-series-dropped callback and move out the rest of the events from wv-droppable-series.
            // @todo Only watch seriesIds & remove deep watch (opti).
            scope.$watch('vm.viewports', function(newViewports, oldViewports) {
                for (var i=0; i<newViewports.length || i<oldViewports.length; ++i) {
                    if (oldViewports[i] && newViewports[i] && oldViewports[i].seriesId === newViewports[i].seriesId
                    || !oldViewports[i] && !newViewports[i]
                    ) {
                        // Ignore changes unrelated to seriesId
                        continue;
                    }

                    // Log new series id
                    console.log('series['+i+']: ', newViewports[i] && newViewports[i].seriesId);

                    // Set viewport's series
                    if (!oldViewports[i] && newViewports[i]) {
                        console.log('Viewport: ', newViewports[i]);
                        if (newViewports[i].seriesId) {
                            $rootScope.$emit('UserSelectedSeriesId', newViewports[i].seriesId);
                        }
                    }
                    // Remove viewport's series
                    else if (oldViewports[i] && !newViewports[i]) {
                        if (oldViewports[i].seriesId) {
                            $rootScope.$emit('UserUnSelectedSeriesId', oldViewports[i].seriesId);
                        }
                    }
                    // Replace viewport's series
                    else if (oldViewports[i] && newViewports[i] && oldViewports[i].seriesId !== newViewports[i].seriesId) {
                        if (oldViewports[i].seriesId) {
                            $rootScope.$emit('UserUnSelectedSeriesId', oldViewports[i].seriesId);
                        }
                        if (newViewports[i].seriesId) {
                            $rootScope.$emit('UserSelectedSeriesId', newViewports[i].seriesId);
                        }
                    }
                }
            }, true);
            // Adapt the viewports to new seriesId if the viewports had no prior configurations.
            scope.$watch('vm.seriesId', function(newSeriesId, oldSeriesId) {
                vm.viewports.forEach(function(viewport) {
                    if (typeof viewport.seriesId === 'undefined') {
                        viewport.seriesId = newSeriesId;
                    }
                });
            });
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();