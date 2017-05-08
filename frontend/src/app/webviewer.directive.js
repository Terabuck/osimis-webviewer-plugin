/**
 * @ngdoc directive
 * @name webviewer.directive:wvWebviewer
 * 
 * @deprecated @param {string} [wvStudyId=undefined]
 * Configure the study shown in the serieslist`wvSerieslistEnabled` must be 
 * true.
 *
 * @param {Array<string>} [wvSelectedStudyIds=EmptyArray] 
 * Configure the studies shown in the serieslist. `wvSerieslistEnabled` must be 
 * true.
 * 
 * @param {boolean} [wvToolbarEnabled=true]
 * Display the toolbar. Note all tools are disabled when the toolbar is 
 * disabled, including the preselected ones (zooming).
 * 
 * @param {boolean} [wvSerieslistEnabled=true]
 * Display the list of series based on the `wvStudyId`. 
 * 
 * @param {boolean} [wvStudyinformationEnabled=true]
 * Display the study information based on the `wvStudyId`.
 *
 * @param {boolean} [wvLefthandlesEnabled=true]
 * Display buttons to toggle the left side of the interface. The right handles
 * are configurable via the transcluded directive.
 * 
 * @param {boolean} [wvNoticeEnabled=false]
 * Display a notice in the bottom side of the application.
 * 
 * @param {string} [wvNoticeText=undefined]
 * The displayed notice content, for instance instructions over mobile
 * ergonomy, or related series / studies.
 * 
 * @param {boolean} [wvSeriesItemSelectionEnabled=false]
 * Let the end-user select series in the serieslist using a single click. This
 * selection has no impact on the standalone viewer. However, host applications
 * can retrieve the selection to do customized actions using the
 * `wvSelectedSeriesItem` parameter. When turned back to false, the selection
 * is kept cached.
 *
 * @param {Array<object>} [wvSelectedSeriesItem=EmptyArray]
 * A list of selected series items. This list can be retrieved to customize the
 * viewer by host applications. See the `wvSeriesItemSelectionEnabled` 
 * parameter. 
 * 
 * @param {string} [wvSeriesId=undefined]
 * Configure the series shown in the main viewport. Viewport's data are reset
 * on change.
 * 
 * @param {object} [wvTools=...]
 * Configure the displayed tools with their default value. See source code for
 * available configuration options.
 *
 * @param {boolean} [wvReadonly=false]
 * Prevent the user from controling the interface. This is primary useful to 
 * prevent liveshare session's attendees interfer with the chair (though the
 * parameter is configured from within the `wvLiveshare` directive).
 *  
 * Especially, the following actions are disabled:
 * 
 * * Drag&dropping series from the `wvSerieslist` into viewports
 * * Using the timeline controls
 * * Using the toolbar & tools
 * * Scrolling through the series via the mousewheel
 *
 * @param {boolean} [wvVideoDisplayEnabled=true]
 * Display videos in the serieslist.
 *
 * @param {boolean} [wvAnnotationstorageEnabled=true]
 * Retrieve annotations from storage. Store annotations to storage
 * automatically. This should be set to false when `wvReadonly` is true.
 * 
 * @scope
 * @restrict E
 * 
 * @description
 * The `wvWebviewer` directive display a whole web viewer at full scale (100%
 * width, 100% height).
 **/
 (function () {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvWebviewer', wvWebviewer);

    /* @ngInject */
    function wvWebviewer($rootScope, wvStudyManager, wvAnnotationManager, wvSeriesManager) {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                readonly: '=?wvReadonly',
                studyId: '=?wvStudyId', // deprecated
                selectedStudyIds: '=?wvSelectedStudyIds',
                seriesId: '=?wvSeriesId',
                tools: '=?wvTools',
                toolbarEnabled: '=?wvToolbarEnabled',
                serieslistEnabled: '=?wvSerieslistEnabled',
                studyinformationEnabled: '=?wvStudyinformationEnabled',
                leftHandlesEnabled: '=?wvLefthandlesEnabled',
                noticeEnabled: '=?wvNoticeEnabled',
                noticeText: '=?wvNoticeText',
                annotationStorageEnabled:  '=?wvAnnotationstorageEnabled',
                // Selection-related
                seriesItemSelectionEnabled: '=?wvSeriesItemSelectionEnabled',
                selectedSeriesItemIds: '=?wvSelectedSeriesItem'
            },
            transclude: {
                wvLayoutTopLeft: '?wvLayoutTopLeft',
                wvLayoutTopRight: '?wvLayoutTopRight',
                wvLayoutRight: '?wvLayoutRight'
            },
            templateUrl: 'app/webviewer.directive.html'
        };
        return directive;

        function link(scope, element, attrs, ctrls, transcludeFn) {
            var vm = scope.vm;

            // Configure attributes default values
            vm.toolbarEnabled = typeof vm.toolbarEnabled !== 'undefined' ? vm.toolbarEnabled : true;
            vm.serieslistEnabled = typeof vm.serieslistEnabled !== 'undefined' ? vm.serieslistEnabled : true;
            vm.studyinformationEnabled = typeof vm.studyinformationEnabled !== 'undefined' ? vm.studyinformationEnabled : true;
            vm.leftHandlesEnabled = typeof vm.leftHandlesEnabled !== 'undefined' ? vm.leftHandlesEnabled : true;
            vm.noticeEnabled = typeof vm.noticeEnabled !== 'undefined' ? vm.noticeEnabled : false;
            vm.noticeText = typeof vm.noticeText !== 'undefined' ? vm.noticeText : undefined;
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
            vm.selectedStudyIds = typeof vm.selectedStudyIds !== 'undefined' ? vm.selectedStudyIds : [];

            // Selection-related
            vm.selectedSeriesIds = vm.selectedSeriesIds || [];
            vm.selectedReportIds = vm.selectedReportIds || [];
            vm.selectedVideoIds = vm.selectedVideoIds || [];
            vm.selectedSeriesItemIds = vm.selectedSeriesItemIds || {};
            // Update selectedSeriesItemIds based on selected***Ids
            scope.$watch(function() {
                return {
                    series: vm.selectedSeriesIds,
                    reports: vm.selectedReportIds,
                    videos: vm.selectedVideoIds
                }
            }, function(newValues, oldValues) {
                var series = newValues
                    .series
                    .map(function(seriesId) {
                        // @todo manage multiframe instances.
                        // @todo convert webviewer series id to orthanc series
                        // id.
                        return {
                            seriesId: seriesId,
                            studyId: vm.studyId,
                            type: 'series'
                        }
                    });

                var reports = newValues
                    .reports
                    .map(function(reportId) {
                        return {
                            instanceId: reportId,
                            studyId: vm.studyId,
                            type: 'report/pdf'
                        }
                    });

                var videos = newValues
                    .videos
                    .map(function(videoId) {
                        return {
                            instanceId: videoId,
                            studyId: vm.studyId,
                            type: 'video/mpeg4'
                        }
                    });

                vm.selectedSeriesItemIds = []
                    .concat(series)
                    .concat(reports)
                    .concat(videos);
            }, true);

            // Activate mobile interaction tools on mobile (not tablet)
            var uaParser = new UAParser();
            vm.mobileInteraction = uaParser.getDevice().type === 'mobile';

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

            // Enable/Disable annotation storage/retrieval from backend
            scope.$watch('vm.annotationStorageEnabled', function(isEnabled, wasEnabled) {
                if (isEnabled) {
                    wvAnnotationManager.enableAnnotationStorage();
                }
                else {
                    wvAnnotationManager.disableAnnotationStorage();
                }
            });

            // Preload studies
            scope.$watch('vm.studyId', function(newStudyId, oldStudyId) {
                // Log study id
                console.log('study: ', newStudyId);

                // Cancel previous preloading
                if (oldStudyId && newStudyId !== oldStudyId) {
                    wvStudyManager.abortStudyLoading(oldStudyId);
                }

                // Preload study
                if (newStudyId) {
                    wvStudyManager.loadStudy(newStudyId);
                    wvAnnotationManager.loadStudyAnnotations(newStudyId);
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
        }
    }

    /* @ngInject */
    function Controller($rootScope, $scope) {
        var vm = this;
    }

})();
