(function(osimis) {
    'use strict';

    function ViewerController($q, wvPaneManager, wvStudyManager) {
        this._isOverlayTextVisible = true;
        this._isOverlayIconsVisible = true;
        this._selectedStudyIds = [];
        this.wvPaneManager = wvPaneManager;
        this.wvStudyManager = wvStudyManager;
        this.$q = $q;
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
            config.csViewport = null;
            config.imageIndex = 0;
            config.isSelected = true;
            this_.wvPaneManager.setPane(selectedPane.x, selectedPane.y, config);
        });
    }

    ViewerController.prototype.previousSeries = function() {
        var selectedPane = this.wvPaneManager.getSelectedPane();
        var this_ = this;
        selectedPane.getPreviousSeriesPaneConfigPromise().then(function(config) {
            config.csViewport = null;
            config.imageIndex = 0;
            config.isSelected = true;
            this_.wvPaneManager.setPane(selectedPane.x, selectedPane.y, config);
        });
    }

    ViewerController.prototype.nextStudy = function() {
        var selectedPane = this.wvPaneManager.getSelectedPane();
        var this_ = this;
        
        selectedPane.getStudy().then(function(study){
            var selectedStudyIds = this_._selectedStudyIds;
            var currentIndex = selectedStudyIds.indexOf(study.id);
            var nextIndex = (currentIndex + 1) % selectedStudyIds.length; // select the next study or the first
            if (currentIndex != nextIndex) {
                return this_.wvStudyManager.get(selectedStudyIds[nextIndex]);
            } else {
                return this_.$q.reject();
            }
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
            var currentIndex = selectedStudyIds.indexOf(study.id);
            var previousIndex = (currentIndex - 1 + selectedStudyIds.length) % selectedStudyIds.length; // select the previous study or the last
            if (currentIndex != previousIndex) {
                return this_.wvStudyManager.get(selectedStudyIds[previousIndex]);
            } else {
                return this_.$q.reject();
            }
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
    function wvViewerController($q, wvPaneManager, wvStudyManager) {
        return new ViewerController($q, wvPaneManager, wvStudyManager);
    }
})(osimis || (this.osimis = {}));