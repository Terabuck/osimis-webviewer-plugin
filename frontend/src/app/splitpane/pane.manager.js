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

        this.panes = []; // Must keep reference as it's databound in `wvWebviewer` views.

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
        this.panes[index] = new osimis.Pane(config);

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