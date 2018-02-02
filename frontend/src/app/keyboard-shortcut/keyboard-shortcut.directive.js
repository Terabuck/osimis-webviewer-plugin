(function(osimis) {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvKeyboardShortcut', keyboardShortcut);

    /* @ngInject */
    function keyboardShortcut($rootScope, wvAnnotationManager, wvStudyManager, wvSeriesManager, wvPdfInstanceManager, wvVideoManager, wvPaneManager, wvKeyboardShortcutEventManager, wvConfig) {
        
        // Keep track of listener unbind functions (so we can close events).
        var _unbindListenerFns = [];

        // Keep track of original `configureViewport` method (it'll be 
        // overriden to solve sync issues). It need to be restored when the
        // liveshare session ends.
        var _originalConfigureViewportFn = undefined;

        var directive = {
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false,
            require: {
                webviewer: '?^wvWebviewer',
            }
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var _this = this;
            var webviewer = ctrls.webviewer;

            wvKeyboardShortcutEventManager.nextStudy && wvKeyboardShortcutEventManager.nextStudy(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane(),
                    selectedStudyIds = webviewer.selectedStudyIds,
                    nextStudyId;
                selectedPane.getStudy().then(function(study){
                    var _index = selectedStudyIds.indexOf(study.id);
                    nextStudyId = _index + 1 < selectedStudyIds.length ? selectedStudyIds[_index + 1] : selectedStudyIds[0];  // select the next study or the first
                    return wvStudyManager.get(nextStudyId)
                }).then(function(nextStudy){
                    var firstItemTuple = nextStudy.getNextItemId(),
                        paneOptions = {csViewport: null, isSelected: true};
                    
                    if(firstItemTuple[1] == "series"){
                        paneOptions.seriesId = firstItemTuple[0];
                    }else if(firstItemTuple[1] == "video"){
                        paneOptions.videoId = firstItemTuple[0];
                    }else {
                        paneOptions.reportId = firstItemTuple[0];
                    }

                    wvPaneManager.setPane(selectedPane.x, selectedPane.y, paneOptions)
                })
            });

            wvKeyboardShortcutEventManager.previousStudy && wvKeyboardShortcutEventManager.previousStudy(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane(),
                    selectedStudyIds = webviewer.selectedStudyIds,
                    previousStudyId;
                selectedPane.getStudy().then(function(study){
                    var _index = selectedStudyIds.indexOf(study.id);
                    previousStudyId = _index - 1 >= 0 ? selectedStudyIds[_index - 1] : selectedStudyIds[selectedStudyIds.length - 1];  // select the next study or the first
                    return wvStudyManager.get(previousStudyId)
                }).then(function(previousStudy){
                    var firstItemTuple = previousStudy.getNextItemId(),
                        paneOptions = {csViewport: null, isSelected: true};
                    
                    if(firstItemTuple[1] == "series"){
                        paneOptions.seriesId = firstItemTuple[0];
                    }else if(firstItemTuple[1] == "video"){
                        paneOptions.videoId = firstItemTuple[0];
                    }else {
                        paneOptions.reportId = firstItemTuple[0];
                    }

                    wvPaneManager.setPane(selectedPane.x, selectedPane.y, paneOptions)
                })
            });

            wvKeyboardShortcutEventManager.nextSeries && wvKeyboardShortcutEventManager.nextSeries(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.getStudy().then(function(study){
                    var currentItemId = selectedPane.seriesId || selectedPane.videoId || selectedPane.reportId,
                        nextItemTuple = study.getNextItemId(currentItemId),
                        paneOptions = {csViewport: null, isSelected: true};

                    if(nextItemTuple[1] == "series"){
                        paneOptions.seriesId = nextItemTuple[0];
                    }else if(nextItemTuple[1] == "video"){
                        paneOptions.videoId = nextItemTuple[0];
                    }else {
                        paneOptions.reportId = nextItemTuple[0];
                    }
                    if(nextItemTuple[0] !== currentItemId){
                        wvPaneManager.setPane(selectedPane.x, selectedPane.y, paneOptions)
                    }
                });
            });
            

            wvKeyboardShortcutEventManager.previousSeries && wvKeyboardShortcutEventManager.previousSeries(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.getStudy().then(function(study){
                    var currentItemId = selectedPane.seriesId || selectedPane.videoId || selectedPane.reportId,
                        previousItemTuple = study.getPreviousItemId(currentItemId),
                        paneOptions = {csViewport: null, isSelected: true};

                    if(previousItemTuple[1] == "series"){
                        paneOptions.seriesId = previousItemTuple[0];
                    }else if(previousItemTuple[1] == "video"){
                        paneOptions.videoId = previousItemTuple[0];
                    }else {
                        paneOptions.reportId = previousItemTuple[0];
                    }

                    if(previousItemTuple[0] !== currentItemId){
                        wvPaneManager.setPane(selectedPane.x, selectedPane.y, paneOptions)
                    }
                });            
            });

            wvKeyboardShortcutEventManager.previousImage && wvKeyboardShortcutEventManager.previousImage(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.series.goToPreviousImage(true);
            });

            wvKeyboardShortcutEventManager.nextImage && wvKeyboardShortcutEventManager.nextImage(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.series.goToNextImage(true);
            });

            wvKeyboardShortcutEventManager.rotateLeft && wvKeyboardShortcutEventManager.rotateLeft(this, function(e){
                wvPaneManager.getSelectedPane().rotateLeft();
            });
            
            wvKeyboardShortcutEventManager.rotateRight && wvKeyboardShortcutEventManager.rotateRight(this, function(e){
                wvPaneManager.getSelectedPane().rotateRight();
            });
            
            wvKeyboardShortcutEventManager.flipVertical && wvKeyboardShortcutEventManager.flipVertical(this, function(e){
                wvPaneManager.getSelectedPane().flipVertical();
            });

            wvKeyboardShortcutEventManager.flipHorizontal && wvKeyboardShortcutEventManager.flipHorizontal(this, function(e){
                wvPaneManager.getSelectedPane().flipHorizontal();
            });
            
            wvKeyboardShortcutEventManager.invertColor && wvKeyboardShortcutEventManager.invertColor(this, function(e){
                wvPaneManager.getSelectedPane().invertColor();
            });
            
            wvKeyboardShortcutEventManager.selectTouchGestureTool && wvKeyboardShortcutEventManager.selectTouchGestureTool(this, function(e){
                angular.element('#toolbox-touch-gesture-button').click();
            });

            wvKeyboardShortcutEventManager.selectPanTool && wvKeyboardShortcutEventManager.selectPanTool(this, function(e){
                angular.element('#toolbox-pan-button').click();
            });

            wvKeyboardShortcutEventManager.selectZoomTool && wvKeyboardShortcutEventManager.selectZoomTool(this, function(e){
                angular.element('#toolbox-zoom-button').click();
            });

            wvKeyboardShortcutEventManager.selectWindowingTool && wvKeyboardShortcutEventManager.selectWindowingTool(this, function(e){
                angular.element('#toolbox-windowing-button').click();
            });

            wvKeyboardShortcutEventManager.selectMagnifyingGlassTool && wvKeyboardShortcutEventManager.selectMagnifyingGlassTool(this, function(e){
                angular.element('#toolbox-magnifying-glass-button').click();
            });

            wvKeyboardShortcutEventManager.selectLengthMeasureTool && wvKeyboardShortcutEventManager.selectLengthMeasureTool(this, function(e){
                angular.element('#toolbox-length-measure-button').click();
            });

            wvKeyboardShortcutEventManager.selectPixelProbeTool && wvKeyboardShortcutEventManager.selectPixelProbeTool(this, function(e){
                angular.element('#toolbox-pixel-probe-button').click();
            });

            wvKeyboardShortcutEventManager.selectEllipticalRoiTool && wvKeyboardShortcutEventManager.selectEllipticalRoiTool(this, function(e){
                angular.element('#toolbox-elliptical-roi-button').click();
            });

            wvKeyboardShortcutEventManager.selectRectangleRoiTool && wvKeyboardShortcutEventManager.selectRectangleRoiTool(this, function(e){
                angular.element('#toolbox-rectangle-roi-button').click();
            });

            wvKeyboardShortcutEventManager.selectArrowAnnotateTool && wvKeyboardShortcutEventManager.selectArrowAnnotateTool(this, function(e){
                angular.element('#toolbox-arrow-annotate-button').click();
            });

            wvKeyboardShortcutEventManager.selectKeyImageCaptureTool && wvKeyboardShortcutEventManager.selectKeyImageCaptureTool(this, function(e){
                angular.element('#toolbox-key-image-capture-button').click();
            });

            scope.$on('$destroy', function() {
                console.log("TODO: destroy all listeners");
                wvKeyboardShortcutEventManager.nextSeries.close(_this);
                wvKeyboardShortcutEventManager.previousSeries.close(_this);
            })
        }
    }

    /* @ngInject */
    function Controller(){
        
    }
})(osimis || (osimis = {}));