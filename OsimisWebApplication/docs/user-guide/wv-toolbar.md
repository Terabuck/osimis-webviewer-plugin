# The toolbar

The **wv-toolbar** allow further interactions with the viewports, such as using measure tools, changing drawing modes, setting the splitpane layout, aso.

## Show a default toolbar connected to a splitpane

> - wv-toolbar
> - (attr) wv-items: object

When **wv-items** is an empty object, all the toolbar items are shown.

```html
<!-- show a splitpane connected to a default toolbar -->
<div class="wv-container">
    <div class="wv-menu">
        <wv-serielist wv-study="studyId"></wv-serielist>
    </div>
    <div class="wv-main" ng-init="toolbar = {}">
        <wv-toolbar wv-items="toolbar"></wv-toolbar>
        <wv-splitpane wv-settings="toolbar"></wv-splitpane>
    </div>
</div>
```

__Note that the *ng-init="toolbar = {}"* is optional in this case. It is recommended to define the object due to angular scope issues.__

## Configure the toolbar

> - (attr) wv-items: object
>       + zoom: boolean
>       + pan: boolean
>       + invert: boolean
>       + lengthmeasure: boolean
>       + anglemeasure: boolean
>       + pixelprobe: boolean
>       + ellipticalroi: boolean
>       + rectangleroi: boolean
>       + layout:
>           +   x: int
>           +   y: int
>       + play: boolean
>       + overlay: boolean

When **wv-items** is not an empty object, only the set items are shown.

```html
<div class="wv-container">
    <div class="wv-menu">
        <wv-serielist wv-study="studyId"></wv-serielist>
    </div>
    <div class="wv-main" ng-init="toolbar = {
            invert: true,
            layout: {x: 1, y: 2}
        }">
        <wv-toolbar wv-items="toolbar"></wv-toolbar>
        <wv-splitpane wv-settings="toolbar"></wv-splitpane>
    </div>
</div>
```


## Create your own toolbar

As the toolbar just manage a databinded object, you can easily create your own. 
The following example shows a user defined 'overlay' button linked to the last splitpane viewport.

```html
<div class="wv-container" ng-init="
layout = {
    x: 2,
    y: 2
};
enableOverlay = true;
">
    <div class="wv-menu">
        <wv-serielist wv-study="studyId"></wv-serielist>
    </div>
    <div class="wv-main">
        <button ng-click="enableOverlay = !enableOverlay" style="height: 40px; margin: 0;">toggle last overlay</button>
        <wv-splitpane wv-layout="layout" style="height: calc(100% - 40px); display:block;">
            <wv-viewport wv-viewport-serie wv-width="'tag'" wv-height="'tag'"
                wv-viewport-mouse-events wv-viewport-droppable
                wv-enable-overlay="($parent.$y == layout.y - 1 &amp;&amp; $parent.$x == layout.x - 1) ? enableOverlay : true"
            ></wv-viewport>
        </wv-splitpane>
    </div>
</div>
```
