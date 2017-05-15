(function(osimis) {
    'use strict';

    // Not used in splitpane directive.
    // Only used in webviewer directive.

    function PaneManager() {
        this.layout = {
            x: 1,   
            y: 1
        };

        this.panes = []; // Must keep reference as it's databound in `wvWebviewer` views.

        // scope.$watch('vm.seriesId', function(seriesId) {
        //     // Set default series id when opening a new pane.
        //     paneManager.setDefaultSeriesId(vm.seriesId);
        // });

        this.viewedSeriesIds = [];
        this.viewedReportIds = [];
        this.viewedVideoIds = [];

        // @todo clean up viewed*Ids when selectable studies change.
    }

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

    PaneManager.prototype.hasReportBeenViewed = function(id) {
        return this.viewedReportIds.indexOf(id) !== -1;
    };
    PaneManager.prototype.hasVideoBeenViewed = function(id) {
        return this.viewedVideoIds.indexOf(id) !== -1;
    };
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