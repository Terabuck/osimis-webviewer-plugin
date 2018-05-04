(function(osimis) {
    'use strict';

    function ViewerController(wvPaneManager, wvStudyManager) {
        this._isOverlayTextVisible = true;
        this._isOverlayIconsVisible = true;
        this._selectedStudyIds = [];
        this.wvPaneManager = wvPaneManager;
        this.wvStudyManager = wvStudyManager;
    }

    ViewerController.prototype.setSelectedStudyIds = function(selectedStudyIds) {
        this._selectedStudyIds = selectedStudyIds;
    }


    ViewerController.prototype.toggleOverlayText = function() {
        this._isOverlayTextVisible = !this._isOverlayTextVisible;
    }
    ViewerController.prototype.isOverlayTextVisible = function() {
    	return this._isOverlayTextVisible;
    }
    ViewerController.prototype.setOverlayTextVisible = function(enabled) {
        this._isOverlayTextVisible = enabled;
    }


    ViewerController.prototype.toggleOverlayIcons = function() {
        this._isOverlayIconsVisible = !this._isOverlayIconsVisible;
    }
    ViewerController.prototype.isOverlayIconsVisible = function() {
    	return this._isOverlayIconsVisible;
    }
    ViewerController.prototype.setOverlayIconsVisible = function(enabled) {
        this._isOverlayIconsVisible = enabled;
    }

    ViewerController.prototype.nextSeries = function() {
        var selectedPane = this.wvPaneManager.getSelectedPane();
        var this_ = this;
        selectedPane.getNextSeriesPaneConfigPromise().then(function(config) {
            this_.wvPaneManager.setPane(selectedPane.x, selectedPane.y, config);
        });
    }

    ViewerController.prototype.previousSeries = function() {
        var selectedPane = this.wvPaneManager.getSelectedPane();
        var this_ = this;
        selectedPane.getPreviousSeriesPaneConfigPromise().then(function(config) {
            this_.wvPaneManager.setPane(selectedPane.x, selectedPane.y, config);
        });
    }

    ViewerController.prototype.nextStudy = function() {
        var selectedPane = this.wvPaneManager.getSelectedPane();
        var this_ = this;
        
        selectedPane.getStudy().then(function(study){
            var selectedStudyIds = this_._selectedStudyIds;
            var _index = selectedStudyIds.indexOf(study.id);
            var nextStudyId = _index + 1 < selectedStudyIds.length ? selectedStudyIds[_index + 1] : selectedStudyIds[0];  // select the next study or the first
            return this_.wvStudyManager.get(nextStudyId)
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

            this_.wvPaneManager.setPane(selectedPane.x, selectedPane.y, paneOptions)
        })
    };

    ViewerController.prototype.previousStudy = function() {
        var selectedPane = this.wvPaneManager.getSelectedPane();
        var this_ = this;
        
        selectedPane.getStudy().then(function(study){
            var selectedStudyIds = this_._selectedStudyIds;
            var _index = selectedStudyIds.indexOf(study.id);
            var previousStudyId = _index - 1 >= 0 ? selectedStudyIds[_index - 1] : selectedStudyIds[selectedStudyIds.length - 1];  // select the previous study or the last
            return this_.wvStudyManager.get(previousStudyId)
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

            this_.wvPaneManager.setPane(selectedPane.x, selectedPane.y, paneOptions)
        })
    };

    angular
        .module('webviewer')
        .factory('wvViewerController', wvViewerController);

    /* @ngInject */
    function wvViewerController(wvPaneManager, wvStudyManager) {
        return new ViewerController(wvPaneManager, wvStudyManager);
    }
})(osimis || (this.osimis = {}));