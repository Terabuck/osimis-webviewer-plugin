/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.PaneManager
 *
 * @description
 * The `PaneManager` class is used to manager the content of the panes. It also
 * stores which series/report/video have been viewed.
 */
(function(osimis) {
    'use strict';

    function PaneManager() {
        this.layout = {
            x: 1,   
            y: 1
        };

        this.panes = [
            new osimis.Pane()
        ]; // Must keep reference as it's databound in `wvWebviewer` views.

        this.viewedSeriesIds = [];
        this.viewedReportIds = [];
        this.viewedVideoIds = [];
        // @todo clean up viewed*Ids when selectable studies change?
    }

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#setLayout
     *
     * @param {number} x
     * The number of columns.
     * 
     * @param {number} y
     * The number of rows.
     * 
     * @description
     * Change the actual layout of the splitpane.
     */
    PaneManager.prototype.setLayout = function(x, y) {
        var actualPaneCount = this.layout.x * this.layout.y;
        var newPaneCount = x * y;

        // Clean up old panes.
        if (newPaneCount < actualPaneCount) {
            for (var i = newPaneCount; i < actualPaneCount; ++i) {
                this.panes[i] = undefined; // don't use splice since it changes the indexes from the array/
            }
        }

        // Configure new panes.
        else if (newPaneCount > actualPaneCount) {
            for (var i = actualPaneCount; i < newPaneCount; ++i) {
                this.panes[i] = new osimis.Pane();
            }
        }

        // Update layout size.
        this.layout.x = x;
        this.layout.y = y;

        // Update selected pane (if the currently selected one no longer
        // exists).
        var selectedPane = this.getSelectedPane();
        var selectedPaneIndex = this.panes.indexOf(selectedPane);
        if (selectedPaneIndex >= this.layout.x * this.layout.y) {
            selectedPane.isSelected = false;
            this.getPane(0).isSelected = true;
        }
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#setPane
     *
     * @param {number} index
     * The index of the pane.
     *
     * @param {object} config
     * See the `osimis.Pane` model for config.
     * 
     * @description
     * Change the configuration of a pane (its content). Also, consider the
     * content of the pane to have been viewed.
     */
    PaneManager.prototype.setPane = function(index, config) {
        // Assert config.
        if (
            typeof config.seriesId !== 'undefined' &&
            typeof config.reportId !== 'undefined' ||
            typeof config.seriesId !== 'undefined' &&
            typeof config.videoId  !== 'undefined' ||
            typeof config.reportId !== 'undefined' &&
            typeof config.videoId !== 'undefined'
        ) {
            throw new Error('A pane can only contain a single reportId/videoId/seriesId at a time.');
        }
        else if (!config.seriesId &&
            (typeof config.csViewport !== 'undefined' ||
            typeof config.imageIndex !== 'undefined')
        ) {
            throw new Error('`csViewport` and `imageIndex` parameter can only be used with a series.');
        }

        // If the new pane is selected, unset the actually selected one.
        if (config.isSelected) {
            this.getSelectedPane().isSelected = false;
        }
        
        // Update config accordingly.
        this.panes[index].seriesId = config.seriesId;
        this.panes[index].reportId = config.reportId;
        this.panes[index].videoId = config.videoId;
        this.panes[index].csViewport = config.csViewport;
        this.panes[index].imageIndex = config.imageIndex;
        this.panes[index].isSelected = config.isSelected || false;

        // Set series as viewed.
        if (config && config.seriesId) {
            this.viewedSeriesIds = _.union([config.seriesId], this.viewedSeriesIds);
        }

        // Set video as viewed.
        if (config && config.reportId) {
            this.viewedReportIds = _.union([config.reportId], this.viewedReportIds);
        }

        // Set pdf/report as viewed.
        if (config && config.videoId) {
            this.viewedVideoIds = _.union([config.videoId], this.viewedVideoIds);
        }
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#getPane
     *
     * @param {number} index
     * The index of the pane to retrieve.
     *
     * @return {osimis.Pane}
     * The pane model.
     *
     * @description
     * Retrieve the pane model via its index.
     */
    PaneManager.prototype.getPane = function(index) {
        return this.panes[index];
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#getSelectedPane
     *
     * @return {osimis.Pane}
     * The currently selected pane.
     *
     * @description
     * Retrieve the currently selected pane model.
     */
    PaneManager.prototype.getSelectedPane = function() {
        var selectedPaneIndex = 0;
        this.panes
            .forEach(function (pane, index) {
                if (pane.isSelected) {
                    selectedPaneIndex = index;
                }
            });

        return this.getPane(selectedPaneIndex);
    }

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#selectPane
     *
     * @param {number} index
     * The index of the pane to select.
     *
     * @description
     * Toggle a pane selection via its index.
     */
    PaneManager.prototype.selectPane = function(index) {
        // Don't do anything if pane is empty.
        var pane = this.getPane(index);
        if (pane.isEmpty()) {
            return;
        };

        // Unset previously selected pane
        this.getSelectedPane().isSelected = false;

        // Set new pane current pane as selected
        this.getPane(index).isSelected = true;
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#isPaneSelected
     *
     * @param {number} index
     * The index of the pane to check selection.
     *
     * @return {boolean}
     * True if the pane is selected.
     *
     * @description
     * Check if a specific pane is selected.
     */
    PaneManager.prototype.isPaneSelected = function(index) {
        return this.getPane(index).isSelected;
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#getPaneIndex
     *
     * @param {number} x
     * The `x` position in the layout.
     *
     * @param {number} y
     * The `y` position in the layout.
     *
     * @return {number}
     * The pane index.
     *
     * @description
     * Retrieve a pane index from it's position within the layout.
     */
    PaneManager.prototype.getPaneIndex = function(x, y) {
        return (y * this.layout.y) + x;
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#hasReportBeenViewed
     *
     * @param {string} id
     * The id of the report.
     *
     * @return {boolean}
     * The value.
     *
     * @description
     * Return true when a report has been put in a pane.
     */
    PaneManager.prototype.hasReportBeenViewed = function(id) {
        return this.viewedReportIds.indexOf(id) !== -1;
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#hasVideoBeenViewed
     *
     * @param {string} id
     * The id of the video.
     *
     * @return {boolean}
     * The value.
     *
     * @description
     * Return true when a video has been put in a pane.
     */
    PaneManager.prototype.hasVideoBeenViewed = function(id) {
        return this.viewedVideoIds.indexOf(id) !== -1;
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#hasSeriesBeenViewed
     *
     * @param {string} id
     * The id of the series.
     *
     * @return {boolean}
     * The value.
     *
     * @description
     * Return true when a series has been put in a pane.
     */
    PaneManager.prototype.hasSeriesBeenViewed = function(id) {
        return this.viewedSeriesIds.indexOf(id) !== -1;
    };

    angular
        .module('webviewer')
        .factory('wvPaneManager', wvPaneManager);

    /* @ngInject */
    function wvPaneManager() {
        return new PaneManager();
    }
})(osimis || (this.osimis = {}));