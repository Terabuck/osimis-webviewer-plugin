/**
 * @ngdoc directive
 * @name webviewer.directive:wvWebviewer
 * 
 * @param {boolean} [wvToolbarEnabled] Display the toolbar.
 *   By default it's disabled on mobile and enabled on desktop.
 *   Note all tools are disabled when the toolbar is disabled, including the
 *   preselected ones (windowing & zooming).
 * 
 * @param {string} [wvStudyId] Configure the study shown in the serieslist
 *   `wvSerieslistEnabled` must be true. Changing the `wvStudyId` resets the
 *   viewports to a (1, 1) layout with the first series of the study shown.
 * 
 * @param {boolean} [wvSerieslistEnabled] Display the list of series
 *   Used to show the list of series of `wv-study-id`.
 * 
 * @param {string} [wvSeriesId] Configure the series shown in the main 
 *   viewport. Viewport's data are reset on change.
 * 
 * @param {object} [wvTools] Configure the displayed tools with their default vaule
 *   See source code for available configuration options.
 *
 * @param {boolean} [wvReadonly=false] Prevent the user from controling the 
 *   interface. This is primary useful to prevent liveshare session's attendees 
 *   interfer with the chair (though the parameter is configured from within 
 *   the `wvLiveshare` directive).
 *    
 *   Especially, the following actions are disabled:
 *   
 *   * Drag&dropping series from the `wvSerieslist` into viewports
 *   * Using the timeline controls
 *   * Using the toolbar & tools
 *   * Scrolling through the series via the mousewheel
 * 
 * @scope
 * @restrict E
 * 
 * @description
 * The `wvWebviewer` directive display a whole web viewer at full scale (100% width, 100% height).
 * 
 * @example
 * The following example show the toolbar, hide the full list of studies,
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
 (function () {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvWebviewer', wvWebviewer);

    /* @ngInject */
    function wvWebviewer($rootScope, wvSeriesManager) {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                readonly: '=?wvReadonly',
                studyId: '=?wvStudyId',
                seriesId: '=?wvSeriesId',
                tools: '=?wvTools',
                toolbarEnabled: '=?wvToolbarEnabled',
                serieslistEnabled: '=?wvSerieslistEnabled'
            },
            transclude: {
                wvLayoutTop1: '?wvLayoutTop1',
                wvLayoutTop4: '?wvLayoutTop4',
                wvLayoutRight: '?wvLayoutRight'
            },
            templateUrl: 'app/webviewer.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            // Configure attributes default values
            vm.toolbarEnabled = typeof vm.toolbarEnabled !== 'undefined' ? vm.toolbarEnabled : true;
            vm.serieslistEnabled = typeof vm.serieslistEnabled !== 'undefined' ? vm.serieslistEnabled : true;
            vm.readonly = typeof vm.readonly !== 'undefined' ? vm.readonly : false;
            vm.tools = typeof vm.tools !== 'undefined' ? vm.tools : {
                windowing: false,
                zoom: true,
                pan: false,
                invert: false,
                lengthmeasure: false,
                anglemeasure: false,
                pixelprobe: false,
                ellipticalroi: false,
                rectangleroi: false,
                layout: {
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

            // Change over these scope variables will in most case change the
            // layout, including the size of the viewport. Therefore, the
            // viewport must be resized. We trigger $(window).resize() for this
            // reason.
            scope.$watchGroup([
                'vm.toolbarEnabled',
                'vm.serieslistEnabled'
            ], function() {
                // we use $evalAsync instead of timeout since it does not
                // trigger reflow.
                scope.$evalAsync(function() {
                    // Resize windows
                    $(window).resize();
                });
            });

            // Store each viewports' states at this level
            // so they can be either later changed by external means (ie. Lify
            // want to retrieve which series is being seen for analysis) or
            // saved for liveshare for instance. 
            vm.viewports = [];
            vm.configureViewport = function(index) {
                vm.viewports[index] = {
                    seriesId: index === 0 ? vm.seriesId : undefined,
                    csViewport: null,
                    imageIndex: 0
                };
            };
            vm.cleanupViewport = function(index) {
                vm.viewports[index] = undefined; // don't use splice since it changes the indexes from the array
            };

            // Preload studies
            scope.$watch('vm.studyId', function(newStudyId, oldStudyId) {
                // Log study id
                console.log('study: ', newStudyId);

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
                    // Ignore changes unrelated to seriesId
                    if (oldViewports[i] && newViewports[i] && oldViewports[i].seriesId === newViewports[i].seriesId
                    || !oldViewports[i] && !newViewports[i]
                    ) {
                        continue;
                    }

                    // Log new series id
                    console.log('series['+i+']: ', newViewports[i] && newViewports[i].seriesId);

                    // Set viewport's series
                    if (!oldViewports[i] && newViewports[i]) {
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

            // Adapt the first viewport to new seriesId
            scope.$watch('vm.seriesId', function(newSeriesId, oldSeriesId) {
                if (vm.viewports[0]) {
                    // Change the series id
                    vm.viewports[0].seriesId = newSeriesId;

                    // Reset image index
                    vm.viewports[0].imageIndex = 0;

                    // Reset the viewport data
                    vm.viewports[0].csViewport = null;
                }
            });

            /* Mobile compatibility */
            
            // Retrieve device type
            var uaParser = new UAParser();
            var deviceType = uaParser.getDevice().type;
            var isMobile = (deviceType === 'mobile' || deviceType === 'tablet');

            // Disable/Activate toolbar on mobile/desktop (resp.) by default
            if (typeof vm.toolbarEnabled === 'undefined') {
                vm.toolbarEnabled = !isMobile ? true : false;
            }


            // Set serieslist default display mode
            if (typeof vm.serieslistMinified === 'undefined') {
                // Minify serieslist on mobile/tablets by default
                if (isMobile) {
                    vm.serieslistMinified = true;
                }
                // Display serieslist in full on other devices
                else {
                    vm.serieslistMinified = false;
                }
            }

            // Show serieslist by default
            if (typeof vm.serieslistHidden === 'undefined') {
                vm.serieslistHidden = false;
            }
        }
    }

    /* @ngInject */
    function Controller($rootScope, $scope) {
        var vm = this;
    }

})();
