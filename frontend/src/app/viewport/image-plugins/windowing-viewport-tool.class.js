/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.WindowingViewportTool
 *
 * @description
 * The `WindowingViewportTool` class applies windowing to a viewport.
 */
(function(osimis) {
    'use strict';

    /* @ngInject */
    function WindowingViewportTool(wvConfig, wvSeriesManager, wvSynchronizer) {
    	this._wvConfig = wvConfig;
        this._wvSeriesManager = wvSeriesManager;
        this._wvSynchronizer = wvSynchronizer;

        this.applyWindowingToPane = function(pane, windowWidth, windowCenter, applyToSynchronizedViewports) {

            if (!pane.csViewport) {
                return;
            }

            // Apply windowing.
            pane.applyWindowing(windowWidth, windowCenter);

            if (applyToSynchronizedViewports) {
                this._applyWindowingToSynchronizedViewports(pane.series, windowWidth, windowCenter);
            }
        };

        this._applyWindowingToSynchronizedViewports = function(series, windowWidth, windowCenter) {
            var synchronizedPanes = this._wvSynchronizer.getListOfSynchronizedPanes(series);
            for (var i = 0; i < synchronizedPanes.length; i++) {
                var pane = synchronizedPanes[i];
                pane.applyWindowing(windowWidth, windowCenter);
            }
        };

	    this.applyWindowingToViewport = function(viewport, deltaX, deltaY, applyToSynchronizedViewports) {
	        var viewportData = viewport.getViewport();

	        // Retrieve image min/max image pixel value and define a
	        // strength parameter proportional to the dynamic range of the
	        // image, so high dynamic images have larger windowing changes
	        // than low dynamic ones.
	        var minPixelValue = viewport.getCurrentImageMinPixelValue();
	        var maxPixelValue = viewport.getCurrentImageMaxPixelValue();
	        var pixelValueDelta = maxPixelValue - minPixelValue;
	        var strength = Math.max(1, Math.log2(pixelValueDelta) - 7);

	        // Retrieve the current scale of the image, so user has more
	        // refined control over zoomed images. For instance, when user
	        // zooms to a specific zone of a mammography, he wishes to
	        // adjust the windowing more precisely than when he sees the
	        // whole image. A better solution would be to define the
	        // strength based on the currently viewed image zone dynamic,
	        // instead of the whole image dynamic, but that's fine for now.
	        // var scale = Math.max(1, Math.min(+viewportData.getScaleForFullResolution(), 3));
	        var scale = 1;

	        var deltaWW = 0;
	        var deltaWC = 0;

	        if (deltaX < 0) {
	            if (this._wvConfig.windowingBehaviour.left == "increase-ww") { deltaWW = -deltaX; }
	            if (this._wvConfig.windowingBehaviour.left == "decrease-ww") { deltaWW = deltaX; }
	            if (this._wvConfig.windowingBehaviour.left == "increase-wc") { deltaWC = -deltaX; }
	            if (this._wvConfig.windowingBehaviour.left == "decrease-wc") { deltaWC = deltaX; }
	        }
	        if (deltaX > 0) {
	            if (this._wvConfig.windowingBehaviour.right == "increase-ww") { deltaWW = deltaX; }
	            if (this._wvConfig.windowingBehaviour.right == "decrease-ww") { deltaWW = -deltaX; }
	            if (this._wvConfig.windowingBehaviour.right == "increase-wc") { deltaWC = deltaX; }
	            if (this._wvConfig.windowingBehaviour.right == "decrease-wc") { deltaWC = -deltaX; }
	        }
	        if (deltaY < 0) {
	            if (this._wvConfig.windowingBehaviour.up == "increase-ww") { deltaWW = -deltaY; }
	            if (this._wvConfig.windowingBehaviour.up == "decrease-ww") { deltaWW = deltaY; }
	            if (this._wvConfig.windowingBehaviour.up == "increase-wc") { deltaWC = -deltaY; }
	            if (this._wvConfig.windowingBehaviour.up == "decrease-wc") { deltaWC = deltaY; }
	        }
	        if (deltaY > 0) {
	            if (this._wvConfig.windowingBehaviour.down == "increase-ww") { deltaWW = deltaY; }
	            if (this._wvConfig.windowingBehaviour.down == "decrease-ww") { deltaWW = -deltaY; }
	            if (this._wvConfig.windowingBehaviour.down == "increase-wc") { deltaWC = deltaY; }
	            if (this._wvConfig.windowingBehaviour.down == "decrease-wc") { deltaWC = -deltaY; }
	        }

	        // Calculate the new ww/wc.
	        var newWindowWidth = +viewportData.voi.windowWidth + (deltaWW / scale * strength);
	        var newWindowCenter = +viewportData.voi.windowCenter + (deltaWC / scale * strength);

	        if (newWindowWidth <= 1) {
	            newWindowWidth = 1;
	        }
            
            viewportData.voi.windowWidth = newWindowWidth;
            viewportData.voi.windowCenter = newWindowCenter;

	        // Update viewport values & redraw the viewport.
	        viewport.setViewport(viewportData);
	        viewport.draw(false);

	        if (applyToSynchronizedViewports) {
	        	var image = viewport.getImage();
                var this_ = this;
	        	this._wvSeriesManager.get(image.instanceInfos.SeriesId).then(function(series) {
                    this_._applyWindowingToSynchronizedViewports(series, newWindowWidth, newWindowCenter);
                });
	        }
	    };
	}

    osimis.WindowingViewportTool = WindowingViewportTool;

    angular
        .module('webviewer')
        .factory('wvWindowingViewportTool', wvWindowingViewportTool);

    /* @ngInject */
    function wvWindowingViewportTool(wvConfig, wvSeriesManager, wvSynchronizer) {
        return new osimis.WindowingViewportTool(wvConfig, wvSeriesManager, wvSynchronizer);
    }
})(this.osimis || (this.osimis = {}));