(function(osimis){
    'use strict';
    
    angular
        .module('webviewer')
        .factory('wvKeyboardShortcutEventManager', wvKeyboardShortcutEventManager);

    /**
     * Service that handle keyboard shortcut event and convert them into different osimis Listener
     * 
     * @Require: https://github.com/RobertWHurst/KeyboardJS
     */

    /* @ngInject */
    function wvKeyboardShortcutEventManager($rootScope, wvConfig, wvStudyManager, wvPaneManager, wvSynchronizer, wvSeriesPlayer){
        this.previousSynchroStatus = undefined;

        keyboardJS.setContext('viewerShortcut');

        var handlers = createHandlers(this);

        if (wvConfig.keyboardShortcutsEnabled) {
            console.log("assigning keyboard shortcuts");
            for (var keyboardCodeString in wvConfig.keyboardShortcuts) {
                var keyboardCodes = keyboardCodeString.split(",");

                var handlerName = wvConfig.keyboardShortcuts[keyboardCodeString];
                if (handlerName in handlers) {
                    bindKey(keyboardCodes, handlers[handlerName]);
                } else {
                    console.log("unable to define a keyboard shortcut for ", keyboardCodeString, " '", handlerName, "'; handler is not available");
                }
            }

            bindKey('shift', handlers.enterTemporaryToggleSynchro, handlers.exitTemporaryToggleSynchro, true);
        } else {
            console.log("keyboard shortcuts are disabled");
        }
        return handlers;

        ////////////

        function bindKey(keyboardCode, keyDownHandler, keyUpHandler, preventRepeat){

            var keyDownFunction = undefined;
            if (keyDownHandler) {
                keyDownFunction = function(e) {
                    console.log('keyboard shortcut listener for ', keyboardCode, ' (down) is being triggered');
                    e.preventDefault();
                    if (preventRepeat) {
                        e.preventRepeat();
                    }
                    $rootScope.$apply(function() {keyDownHandler();});
                }
            }
            var keyUpFunction = undefined;
            if (keyUpHandler) {
                keyUpFunction = function(e) {
                    console.log('keyboard shortcut listener for ', keyboardCode, ' (up) is being triggered');
                    e.preventDefault();
                    $rootScope.$apply(function() {keyUpHandler();});
                }
            }

            keyboardJS.bind(keyboardCode, keyDownFunction, keyUpFunction);
        }

        function createHandlers(this_) {
            var handlers = {};
            
            handlers.toggleSynchro = function() {
                wvSynchronizer.toggle();
            } 
            handlers.enableSynchro = function() {
                wvSynchronizer.enable(true);
            } 
            handlers.disableSynchro = function() {
                wvSynchronizer.enable(false);
            } 
            handlers.enterTemporaryToggleSynchro = function() {
                if (this_.previousSynchroStatus === undefined) {
                    this_.previousSynchroStatus = wvSynchronizer.isEnabled();
                    wvSynchronizer.enable(!this_.previousSynchroStatus);
                }
            }
            handlers.exitTemporaryToggleSynchro = function() {
                wvSynchronizer.enable(this_.previousSynchroStatus);
                this_.previousSynchroStatus = undefined;
            }

            handlers.play = function() {
                var selectedPane = wvPaneManager.getSelectedPane();
                wvSeriesPlayer.play(selectedPane.series)
            }
            handlers.pause = function() {
                var selectedPane = wvPaneManager.getSelectedPane();
                wvSeriesPlayer.pause(selectedPane.series)
            }
            handlers.playPause = function() {
                var selectedPane = wvPaneManager.getSelectedPane();
                if (wvSeriesPlayer.isPlaying(selectedPane.series)) {
                    wvSeriesPlayer.pause(selectedPane.series);
                } else {
                    wvSeriesPlayer.play(selectedPane.series);
                }
            }

            handlers.null = function() {
            }

            handlers.nextStudy = function() {
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
            }

            handlers.previousStudy = function() {
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
            }

            handlers.nextSeries = function() {
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
            }
            
            handlers.previousSeries = function() {
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
            }

            handlers.previousImage = function() {
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.series.goToPreviousImage(true);
                wvSynchronizer.update(selectedPane.series);
            }

            handlers.nextImage = function() {
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.series.goToNextImage(true);
                wvSynchronizer.update(selectedPane.series);
            }

            handlers.rotateLeft = function() {
                wvPaneManager.getSelectedPane().rotateLeft();
            }
            
            handlers.rotateRight = function() {
                wvPaneManager.getSelectedPane().rotateRight();
            }
            
            handlers.flipVertical = function() {
                wvPaneManager.getSelectedPane().flipVertical();
            }

            handlers.flipHorizontal = function() {
                wvPaneManager.getSelectedPane().flipHorizontal();
            }
            
            handlers.invertColor = function() {
                wvPaneManager.getSelectedPane().invertColor();
            }

            handlers.setLayout1x1 = function() {
                wvPaneManager.setLayout(1, 1);
            }
            handlers.setLayout1x2 = function() {
                wvPaneManager.setLayout(1, 2);
            }
            handlers.setLayout2x1 = function() {
                wvPaneManager.setLayout(2, 1);
            }
            handlers.setLayout2x2 = function() {
                wvPaneManager.setLayout(2, 2);
            }

            handlers.selectNextPane = function() {
                wvPaneManager.selectNextPane();
            }
            handlers.selectPreviousPane = function() {
                wvPaneManager.selectPreviousPane();
            }

            handlers.loadSeriesInPane = function() {
                //opens a series in the selected pane if it's empty
                var selectedPane = wvPaneManager.getSelectedPane();
                if (!selectedPane.isEmpty()) {
                    return;
                }
                // find the previous pane with content -> we'll get the next series
                var previousPaneWithContent =  null;
                var currentPane = selectedPane;
                while (previousPaneWithContent == null) {
                    currentPane = wvPaneManager.getPreviousPane(currentPane);
                    if (!currentPane.isEmpty()) {
                        previousPaneWithContent = currentPane;
                    }
                } 

                previousPaneWithContent.getStudy().then(function(study){
                    var currentItemId = previousPaneWithContent.seriesId || previousPaneWithContent.videoId || previousPaneWithContent.reportId,
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
            }
            
            handlers.selectCombinedTool = function() {
                angular.element('#toolbox-combined-tool-button').click();
            }

            handlers.selectPanTool = function() {
                angular.element('#toolbox-pan-button').click();
            }

            handlers.selectZoomTool = function() {
                angular.element('#toolbox-zoom-button').click();
            }

            handlers.selectWindowingTool = function() {
                angular.element('#toolbox-windowing-button').click();
            }

            handlers.selectMagnifyingGlassTool = function() {
                angular.element('#toolbox-magnifying-glass-button').click();
            }

            handlers.selectLengthMeasureTool = function() {
                angular.element('#toolbox-length-measure-button').click();
            }

            handlers.selectPixelProbeTool = function() {
                angular.element('#toolbox-pixel-probe-button').click();
            }

            handlers.selectEllipticalRoiTool = function() {
                angular.element('#toolbox-elliptical-roi-button').click();
            }

            handlers.selectRectangleRoiTool = function() {
                angular.element('#toolbox-rectangle-roi-button').click();
            }

            handlers.selectArrowAnnotateTool = function() {
                angular.element('#toolbox-arrow-annotate-button').click();
            }

            handlers.selectKeyImageCaptureTool = function() {
                angular.element('#toolbox-key-image-capture-button').click();
            }

            handlers.applyEmbeddedWindowingPreset1 = function() {
                wvPaneManager.getSelectedPane().applyEmbeddedWindowingPreset(0);
            }
            handlers.applyEmbeddedWindowingPreset2 = function() {
                wvPaneManager.getSelectedPane().applyEmbeddedWindowingPreset(1);
            }
            handlers.applyEmbeddedWindowingPreset3 = function() {
                wvPaneManager.getSelectedPane().applyEmbeddedWindowingPreset(2);
            }
            handlers.applyEmbeddedWindowingPreset4 = function() {
                wvPaneManager.getSelectedPane().applyEmbeddedWindowingPreset(3);
            }
            handlers.applyEmbeddedWindowingPreset5 = function() {
                wvPaneManager.getSelectedPane().applyEmbeddedWindowingPreset(4);
            }

            handlers.applyConfigWindowingPreset1 = function() {
                wvPaneManager.getSelectedPane().applyConfigWindowingPreset(0);
            }
            handlers.applyConfigWindowingPreset2 = function() {
                wvPaneManager.getSelectedPane().applyConfigWindowingPreset(1);
            }
            handlers.applyConfigWindowingPreset3 = function() {
                wvPaneManager.getSelectedPane().applyConfigWindowingPreset(2);
            }
            handlers.applyConfigWindowingPreset4 = function() {
                wvPaneManager.getSelectedPane().applyConfigWindowingPreset(3);
            }
            handlers.applyConfigWindowingPreset5 = function() {
                wvPaneManager.getSelectedPane().applyConfigWindowingPreset(4);
            }

            return handlers;
        }
    }

})(this.osimis || (this.osimis = {}));

