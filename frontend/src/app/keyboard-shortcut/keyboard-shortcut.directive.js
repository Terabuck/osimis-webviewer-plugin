(function(osimis) {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvKeyboardShortcut', keyboardShortcut);

    /* @ngInject */
    function keyboardShortcut($rootScope, wvAnnotationManager, wvStudyManager, wvSeriesManager, wvPdfInstanceManager, wvVideoManager, wvPaneManager, wvKeyboardShortcutEventManager) {
        
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

            wvKeyboardShortcutEventManager.majDown(this, function(e){
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

            wvKeyboardShortcutEventManager.majUp(this, function(e){
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

            wvKeyboardShortcutEventManager.down(this, function(e){
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
            

            wvKeyboardShortcutEventManager.up(this, function(e){
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

            wvKeyboardShortcutEventManager.left(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.series.goToPreviousImage(true);
            });

            wvKeyboardShortcutEventManager.right(this, function(e){
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane.series.goToNextImage(true);
            });
            
            scope.$on('$destroy', function() {
                wvKeyboardShortcutEventManager.down.close(_this);
                wvKeyboardShortcutEventManager.up.close(_this);
            })
        }
    }

    /* @ngInject */
    function Controller(){
        
    }
})(osimis || (osimis = {}));