(function(module) {

    var lastTouchPanningCenter = null;  // this is shared betwwen all HammerWrappers because the final event is often received by the oneTouch handler (i.e: when you release your twoTouch, you often release one finger after the other and the final event is issued by the oneTouch handler)
    var maxTouchCountInThisMove = 0;

    function HammerWrapper(enabledElement, touchCount, viewport, toolName, wvWindowingViewportTool, wvPanViewportTool) {
        var _this = this;
        this._touchCount = touchCount;
        this._viewport = viewport;
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

            if (lastTouchPanningCenter === null){
                lastTouchPanningCenter = ev.center;
                return;
            }
            if (ev.isFinal){
                maxTouchCountInThisMove = 0;
                lastTouchPanningCenter = null;
                return;
            }
            
            if (_this._touchCount < maxTouchCountInThisMove) // we are releasing a twoTouch move one finger before the other -> don't apply the one touch action
                return;
            maxTouchCountInThisMove = Math.max(maxTouchCountInThisMove, _this._touchCount);

            var viewportData = _this._viewport.getViewport();
            var deltaX, deltaY, scale;
            scale = +viewportData.scale;
            deltaX = ev.center.x - lastTouchPanningCenter.x;
            deltaY = ev.center.y - lastTouchPanningCenter.y;
            if (_this._toolName === "windowing") {
                wvWindowingViewportTool.apply(_this._viewport, deltaX, deltaY, true);
            } else if (_this._toolName === "pan") {
                wvPanViewportTool.apply(_this._viewport, deltaX, deltaY);
            }

            lastTouchPanningCenter = ev.center;

            return;
        });

        this.destroy = function() {
            this._hammer.destroy();
        }
    };


    module.HammerWrapper = HammerWrapper;

})(window.osi ? window.osi : (window.osi = {}));