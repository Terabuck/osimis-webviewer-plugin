/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.Pane
 *
 * @description
 * The `Pane` class is used to represent the content of a pane. A pane can
 * either contain:
 * 
 * - a video.
 * - a (PDF) report.
 * - a series of images.
 *
 * When the pane contains a series of image, the model also store which image
 * is being viewed within the series, and the state of the viewport (ww/wc,
 * ...), so the pane can be shared across network as is (ie. via liveshare) or
 * stored.
 */
(function(osimis) {
    'use strict';

    function Pane(config) {
        // Assert config
        if (
            config &&
            typeof config.seriesId !== 'undefined' &&
            typeof config.reportId !== 'undefined' ||
            config &&
            typeof config.seriesId !== 'undefined' &&
            typeof config.videoId  !== 'undefined' ||
            config &&
            typeof config.reportId !== 'undefined' &&
            typeof config.videoId !== 'undefined'
        ) {
            throw new Error('A pane can only contain a single reportId/videoId/seriesId at a time.');
        }
        else if (config && !config.seriesId &&
            (typeof config.csViewport !== 'undefined' ||
            typeof config.imageIndex !== 'undefined')
        ) {
            throw new Error('`csViewport` and `imageIndex` parameter can only be used with a series.');
        }

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

    Pane.prototype.isEmpty = function() {
        return !this.seriesId && !this.videoId && !this.reportId;
    }

    osimis.Pane = Pane;

})(this.osimis || (this.osimis = {}));