(function(osimis) {
    "use strict";

    function Pane(config) {
        // @todo Assert config

        // Default values: nothing is shown
        if (!config) {
            this.seriesId = undefined;
            this.csViewport = null;
            this.imageIndex = 0;
            this.reportId = undefined;
            this.videoId = undefined;
        }
        // Custom values.
        else {
            this.seriesId = config.seriesId || undefined;
            this.csViewport = config.csViewport || null;
            this.imageIndex = config.imageIndex || 0;
            this.reportId = config.reportId || undefined;
            this.videoId = config.videoId || undefined;
        }
    }

    osimis.Pane = Pane;

})(osimis || (this.osimis = {}));