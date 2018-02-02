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
    function WindowingViewportTool(wvConfig) {
    	this._wvConfig = wvConfig;

	    this.apply = function(viewport, deltaX, deltaY) {
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
	            if (this._wvConfig.mouseBehaviour.windowingLeft == "increase-ww") { deltaWW = -deltaX; }
	            if (this._wvConfig.mouseBehaviour.windowingLeft == "decrease-ww") { deltaWW = deltaX; }
	            if (this._wvConfig.mouseBehaviour.windowingLeft == "increase-wc") { deltaWC = -deltaX; }
	            if (this._wvConfig.mouseBehaviour.windowingLeft == "decrease-wc") { deltaWC = deltaX; }
	        }
	        if (deltaX > 0) {
	            if (this._wvConfig.mouseBehaviour.windowingRight == "increase-ww") { deltaWW = deltaX; }
	            if (this._wvConfig.mouseBehaviour.windowingRight == "decrease-ww") { deltaWW = -deltaX; }
	            if (this._wvConfig.mouseBehaviour.windowingRight == "increase-wc") { deltaWC = deltaX; }
	            if (this._wvConfig.mouseBehaviour.windowingRight == "decrease-wc") { deltaWC = -deltaX; }
	        }
	        if (deltaY < 0) {
	            if (this._wvConfig.mouseBehaviour.windowingUp == "increase-ww") { deltaWW = -deltaY; }
	            if (this._wvConfig.mouseBehaviour.windowingUp == "decrease-ww") { deltaWW = deltaY; }
	            if (this._wvConfig.mouseBehaviour.windowingUp == "increase-wc") { deltaWC = -deltaY; }
	            if (this._wvConfig.mouseBehaviour.windowingUp == "decrease-wc") { deltaWC = deltaY; }
	        }
	        if (deltaY > 0) {
	            if (this._wvConfig.mouseBehaviour.windowingDown == "increase-ww") { deltaWW = deltaY; }
	            if (this._wvConfig.mouseBehaviour.windowingDown == "decrease-ww") { deltaWW = -deltaY; }
	            if (this._wvConfig.mouseBehaviour.windowingDown == "increase-wc") { deltaWC = deltaY; }
	            if (this._wvConfig.mouseBehaviour.windowingDown == "decrease-wc") { deltaWC = -deltaY; }
	        }

	        // Calculate the new ww/wc.
	        var newWindowWidth = +viewportData.voi.windowWidth + (deltaWW / scale * strength);
	        var newWindowCenter = +viewportData.voi.windowCenter + (deltaWC / scale * strength);

	        // Clamp windowing values to the min/max one availables, so
	        // image doesn't become invisible because of out of scope
	        // value.
	        if (newWindowWidth >= minPixelValue && newWindowWidth <= maxPixelValue) {
	            viewportData.voi.windowWidth = newWindowWidth;
	        }
	        if (newWindowCenter >= minPixelValue && newWindowCenter <= maxPixelValue) {
	            viewportData.voi.windowCenter = newWindowCenter;
	        }

	        // Update viewport values & redraw the viewport.
	        viewport.setViewport(viewportData);
	        viewport.draw(false);
	    };
	}

    osimis.WindowingViewportTool = WindowingViewportTool;

    angular
        .module('webviewer')
        .factory('wvWindowingViewportTool', wvWindowingViewportTool);

    /* @ngInject */
    function wvWindowingViewportTool(wvConfig) {
        return new osimis.WindowingViewportTool(wvConfig);
    }
})(this.osimis || (this.osimis = {}));