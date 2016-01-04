# The splitpane

The **wv-splitpane** provides a way to show multiple viewports at once. At the moment, it is meant to be used with viewport drag & drop.

## Show a basic splitpane

> - wv-splitpane
> - (attr) wv-layout: object
>     + x: int
>     + y: int

A basic example showing the creation of a 2x2 splitpane.

```html
<div class="wv-container">
    <div class="wv-menu">
        <wv-serielist wv-study="studyId"></wv-serielist>
    </div>
    <div class="wv-main">
        <wv-splitpane wv-layout="{x: 2, y: 2}"></wv-splitpane>
    </div>
</div>
```

## Configure the viewports

> - (attr) wv-settings: object (__see the toolbar doc section__ or the wv-toolbar.js source file for more details)
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

## Configure the viewports (advanced)

To acquire more control over the splitpane's viewports, you can override the transcluded template as well.

The index of the pane can be accessed through the scope properties *$parent.$x* and *$parent.$y*.

Each splitpane's viewports are droppable by default. You might want to remove this behavior for instance. To achieve that, you have to remove the **wv-viewport-droppable** tag from the **wv-viewport** directive.

The following example show how to disable the drag & drop and to use the specified serie ids instead. The first overlay is hidden.

```html
<div class="wv-container" ng-init="series = {
    0: '635faa23-fd8378ee-d03bce29-ee47c2fb-a65c5509',
    1: '3ca69615-fcd4a4fb-e5f2cc9d-9c7a49a5-add98bbf'
}">
    <wv-splitpane wv-layout="{x: 2, y: 1}">
        <wv-viewport wv-viewport-serie="series[$parent.$x]" wv-width="'tag'" wv-height="'tag'"
            wv-viewport-mouse-events wv-scroll-on-wheel="true"
            wv-enable-overlay="$parent.$x != 0"
        ></wv-viewport>
    </wv-splitpane>
</div>
```

_Note this example is useless. Splitpanes should only be used when the number of viewport may dynamicaly changes. Two separate viewports could have been used instead._