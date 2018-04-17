(function(osimis) {
    'use strict';

    function ViewerController() {
        this._isOverlayTextVisible = true;
        this._isOverlayIconsVisible = true;
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

    angular
        .module('webviewer')
        .factory('wvViewerController', wvViewerController);

    /* @ngInject */
    function wvViewerController() {
        return new ViewerController();
    }
})(osimis || (this.osimis = {}));