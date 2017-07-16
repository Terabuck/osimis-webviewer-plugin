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

    function PaneManager(Promise, studyManager, seriesManager) {
        // Injections.
        this._Promise = Promise;
        this._studyManager = studyManager;
        this._seriesManager = seriesManager;

        // Default config.
        this.layout = {
            x: 1,
            y: 1
        };

        // Panes.
        // Must keep reference as it's databound in `wvWebviewer` views.
        this.panes = [
            new osimis.Pane(this._Promise, this._studyManager, this._seriesManager, 0, 0)
        ];
        this.panes[0].isSelected = true;

        this.viewedSeriesIds = [];
        this.viewedReportIds = [];
        this.viewedVideoIds = [];
        // @todo clean up viewed*Ids when selectable studies change?

        this.onSelectedPaneChanged = new osimis.Listener();
    }

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#setLayout
     *
     * @param {number} columnCount
     * The number of columns.
     * 
     * @param {number} rowCount
     * The number of rows.
     * 
     * @description
     * Change the actual layout of the splitpane.
     */
    PaneManager.prototype.setLayout = function(columnCount, rowCount) {
        var oldColumnCount = this.layout.x;
        var oldRowCount = this.layout.y;
        var i, x, y = null;

        // Update layout count.
        this.layout.x = columnCount;
        this.layout.y = rowCount;

        // 1. Remove old panes.
        var removedPanes = [];
        var hasSelectedPaneBeenRemoved = false;
        for (i=this.panes.length-1; i>=0; --i) {
            var pane = this.panes[i];

            if (pane.x >= columnCount || pane.y >= rowCount) {
                this.panes.splice(i, 1);

                // Store removed pane so we can move it (for instance if the
                // end-user switches columns/rows, so he can keep the panes'
                // content).
                if (!pane.isEmpty()) {
                    removedPanes.push(pane);
                }

                // Make sure we reselect a pane later if none is selected
                // anymore.
                if (pane.isSelected) {
                    hasSelectedPaneBeenRemoved = true;
                }
            }
        }

        // 3. Create new panes.
        var columnCountDiff = Math.abs(columnCount - oldColumnCount);
        var rowCountDiff = Math.abs(rowCount - oldRowCount);
        if (columnCountDiff + rowCountDiff > 0) {
            for (y=0; y<rowCount; ++y) {
                for (x=0; x<columnCount; ++x) {
                    // Ignore already created panes.
                    if (y < oldRowCount && x < oldColumnCount && !this.getPane(x, y).isEmpty()) {
                        continue;
                    }
                    
                    // Remove empty pane so it can be replaced (or recreated).
                    if (y < oldRowCount && x < oldColumnCount) {
                        var paneToRemove = this.getPane(x, y);
                        this.panes.splice(this.panes.indexOf(paneToRemove), 1);
                        if (paneToRemove.isSelected) {
                            hasSelectedPaneBeenRemoved = true; 
                        }
                    }

                    // Retrieve panes from the previously removed one.
                    var pane = removedPanes.pop();
                    // If none exist, create a new one.
                    if (!pane) {
                        pane = new osimis.Pane(this._Promise, this._studyManager, this._seriesManager, x, y);
                    }
                    // Otherwise, move the previously removed pane into its new
                    // position.
                    else {
                        pane.x = x;
                        pane.y = y;
                        
                        // Don't reselect another pane if the current one was
                        // already selected.
                        if (pane.isSelected) {
                            hasSelectedPaneBeenRemoved = false;
                        }
                    } 

                    this.panes.push(pane);
                }
            }
        }

        // 4. Ensure one pane is selected.
        if (hasSelectedPaneBeenRemoved) {
            // Select first filled pane if available.
            for (var i=0; i<this.panes.length; ++i) {
                var pane = this.panes[i];
                if (!pane.isEmpty()) {
                    pane.isSelected = true;
                    hasSelectedPaneBeenRemoved = false;
                    break;
                }
            }
            // Select an empty pane if no filled pane has been found.
            if (hasSelectedPaneBeenRemoved && this.panes.length > 0) {
                var pane = this.panes[0];
                pane.isSelected = true;
            }
        }
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#setPane
     *
     * @param {number} x
     * The row of the pane.
     *
     * @param {number} y
     * The column of the pane.
     *
     * @param {object} config
     * See the `osimis.Pane` model for config.
     * 
     * @description
     * Change the configuration of a pane (its content). Also, consider the
     * content of the pane to have been viewed.
     */
    PaneManager.prototype.setPane = function(x, y, config) {
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
            (config.csViewport || config.imageIndex)
        ) {
            throw new Error('`csViewport` and `imageIndex` parameter can only be used with a series.');
        }

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

        // Update pane's config accordingly.
        var pane = this.getPane(x, y);
        pane.seriesId = config.seriesId;
        pane.reportId = config.reportId;
        pane.videoId = config.videoId;
        pane.csViewport = config.csViewport;
        pane.imageIndex = config.imageIndex;
        // If the new pane is selected, unset the actually selected one.
        if (config.isSelected) {
            var previouslySelectedPane = this.getSelectedPane();
            var newlySelectedPane = pane;

            previouslySelectedPane.isSelected = false;
            newlySelectedPane.isSelected = config.isSelected || false;

            // Trigger selected pane changed event.
            this.onSelectedPaneChanged.trigger(newlySelectedPane);
        }
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#getPane
     *
     * @param {number} x
     * The row of the pane.
     *
     * @param {number} y
     * The column of the pane.
     *
     * @return {osimis.Pane}
     * The pane model.
     *
     * @description
     * Retrieve the pane model via its position.
     */
    PaneManager.prototype.getPane = function(x, y) {
        // Search the pane at that position.
        for (var i=0; i<this.panes.length; ++i) {
            var pane = this.panes[i];
            if (pane.isAtPosition(x, y)) {
                return pane;
            }
        }

        // Return null if not found.
        return null;
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
        // Return the selected pane.
        for (var i=0; i<this.panes.length; ++i) {
            var pane = this.panes[i];
            if (pane.isSelected) {
                return pane;
            }
        }

        // Throw exception if not found. Should never be thrown, as one pane 
        // should always be selected, even if it is empty (thus not visible
        // as selected by the end-user).
        throw new Error('Assert: No selected pane.');
    }

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#selectPane
     *
     * @param {number} x
     * The row of the pane.
     *
     * @param {number} y
     * The column of the pane.
     *
     * @description
     * Toggle a pane selection via its index.
     */
    PaneManager.prototype.selectPane = function(x, y) {
        var previouslySelectedPane = this.getSelectedPane();
        var newlySelectedPane = this.getPane(x, y);
        
        // Don't do anything if pane is empty.
        var newlySelectedPane = this.getPane(x, y);
        if (newlySelectedPane.isEmpty()) {
            return;
        };

        // Unset previously selected pane
        previouslySelectedPane.isSelected = false;

        // Set new pane current pane as selected
        newlySelectedPane.isSelected = true;

        // Trigger selected pane changed event.
        this.onSelectedPaneChanged.trigger(newlySelectedPane);
    };

    /**
     * @ngdoc method
     * @methodOf osimis.PaneManager
     * 
     * @name osimis.PaneManager#isPaneSelected
     *
     * @param {number} x
     * The row of the pane.
     *
     * @param {number} y
     * The column of the pane.
     *
     * @return {boolean}
     * True if the pane is selected.
     *
     * @description
     * Check if a specific pane is selected.
     */
    PaneManager.prototype.isPaneSelected = function(x, y) {
        var pane = this.getPane(x, y);

        // Return false if the pane doesn't exists. This happens when we switch
        // from 1x2 layout to 2x1 layout. It appears that the switch happens
        // asynchronously between the imperative code and the declarative one.
        // @warning may cause asynchronicity issues.
        if (!pane) {
            return false;
        }

        return pane.isSelected;
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
    // PaneManager.prototype.getPaneIndex = function(x, y) {
    //     return (y * this.layout.x) + x;
    // };

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
    function wvPaneManager($q, wvStudyManager, wvSeriesManager) {
        return new PaneManager($q, wvStudyManager, wvSeriesManager);
    }
})(osimis || (this.osimis = {}));