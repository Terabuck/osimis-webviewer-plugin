(function(module) {

    function HammerWrapper(enabledElement, touchCount, viewport, toolName, wvWindowingViewportTool, wvPanViewportTool) {
        var _this = this;
        this._touchCount = touchCount;
        this._viewport = viewport;
        this._lastTouchPanningCenter = null;
        this._toolName = toolName;

        this._hammer = new Hammer(enabledElement);

        this._hammer.get("pan").set({
            direction: Hammer.DIRECTION_ALL,
            pointers: touchCount
        });

        this._hammer.on("pan", function(ev) {
            if (ev.pointerType !== "touch"){
                return;
            }

            if (_this._lastTouchPanningCenter === null){
                // at the end of a pinch event, a panning event is fired, which will set the lastPanningCenter. To prevent it we check
                // if the ev isFinal is not here to set it. It will prevent the image from bumping out at the next real panning event.
                if (!ev.isFinal){
                    _this._lastTouchPanningCenter = ev.center;
                }
                return;
            }
            var viewportData = _this._viewport.getViewport();
            var deltaX, deltaY, scale;
            scale = +viewportData.scale;
            deltaX = ev.center.x - _this._lastTouchPanningCenter.x;
            deltaY = ev.center.y - _this._lastTouchPanningCenter.y;
            if (_this._toolName === "windowing") {
                wvWindowingViewportTool.apply(_this._viewport, deltaX, deltaY);
            } else if (_this._toolName === "pan") {
                wvPanViewportTool.apply(_this._viewport, deltaX, deltaY);
            }

            _this._lastTouchPanningCenter = ev.center;
            if (ev.isFinal){
                _this._lastTouchPanningCenter = null;
            }

            return;
        });

        this.destroy = function() {
            this._hammer.destroy();
        }
    };


    module.HammerWrapper = HammerWrapper;

})(window.osi ? window.osi : (window.osi = {}));