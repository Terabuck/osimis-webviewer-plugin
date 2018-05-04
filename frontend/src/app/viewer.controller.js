(function(osimis) {
    'use strict';

    function ViewerController(wvPaneManager) {
        this._isOverlayTextVisible = true;
        this._isOverlayIconsVisible = true;
        this.wvPaneManager = wvPaneManager;
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

    angular
        .module('webviewer')
        .factory('wvViewerController', wvViewerController);

    /* @ngInject */
    function wvViewerController(wvPaneManager) {
        return new ViewerController(wvPaneManager);
    }
})(osimis || (this.osimis = {}));