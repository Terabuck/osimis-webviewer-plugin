# The viewport

The viewport has the responisibilty to show and manipulate an image.

The manipulations includes :

- zooming
- inverting colors
- panning
- scaling
- windowing

As an input, the viewport uses an orthanc instance id. It may as well use a whole orthanc serie id though (see section "Scroll through a serie").

## Show a basic instance
> - wv-viewport
> - (attr) wv-instance: string (id)
> - (attr) wv-enable-overlay: boolean

To show a dicom instance, use the **wv-viewport** directive.

```html
<wv-viewport wv-instance="'ee5869df-a11c4629-0800f719-fce4b646-f207b5ac'"><!--

 you should not leave **any** caracter between opening and closing tags.

--></wv-viewport>

<!-- as for any angularjs directive, the ending tag is always required. -->

```

**wv-instance** is used to specify the remote instance id.

An overlay is enabled by default. It can be disabled by setting the parameter *wv-enable-overlay* to _false_.

```html
<wv-viewport wv-instance="id" wv-enable-overlay="false"></wv-viewport>
<!--
- Notice the id value is this time a scope variable name instead of a plain value. 
- Also, although wv-enable-overlay can be set to true or false without the single quotes,
  it can also be databinded to a scope value as well.
-->
```

## Specify the viewport size
> - (attr) wv-width: string ('auto', 'tag', '...px', '...em', aso.)
> - (attr) wv-height: string ('auto', 'tag', '...px', '...em', aso.)
> - (attr) wv-size-tag: void

By default, the size of the viewport equals the size of the first dicom image.

```html
<wv-viewport wv-instance="id"></wv-viewport>
<!-- same as -->
<wv-viewport wv-width="'auto'" wv-height="'auto'"></wv-viewport>
```

For large image size, it is not convenient.

**wv-height** and **wv-width** can be used to set a specific size in any standard css measure unit.

```html
<wv-viewport wv-instance="id" wv-width="'150px'" wv-height="'150px'"></wv-viewport>
```

The *auto* keyword can be used to keep the image ratio.

```html
<!-- wv-height equals wv-width * image-ratio -->
<wv-viewport wv-instance="id" wv-width="'150px'" wv-height="'auto'"></wv-viewport>

<!-- wv-width equals wv-height / image-ratio -->
<wv-viewport wv-instance="id" wv-width="'auto'" wv-height="'150px'"></wv-viewport>
```

A special 'tag' mode allows you to fit the viewport in an ancestor element. The viewport width & height will equals the element contaning the **wv-size-tag**. Note that at the moment, it only works when both the width & the height are set to 'tag' together.

```html
<div class="some ancestor" wv-size-tag>
    <div class="someone else">
        <wv-viewport wv-instance="id" wv-width="'tag'" wv-height="'tag'"></wv-viewport>
    </div>
</div>
```

In some rare case, you might want to recalculate the viewport size. This can be done using this standard jquery code.

```javascript
$(window).resize();
```

## Add standard controls: Windowing, Panning & Scaling

> - (attr) wv-viewport-mouse-events: void

The viewport can obtain the following basic controls when **wv-viewport-mouse-event** is used :
- windowing (left mouse click)
- panning (middle mouse click)
- scaling (right mouse click)

```html
<wv-viewport wv-instance="id" wv-viewport-mouse-events></wv-viewport>
```

## Scroll through a serie

> - (attr) wv-viewport-serie: string (id)

**wv-viewport-serie** enable to scroll through a serie's instances using the mouse horizontal scrolling.

_Note: the **wv-instance** parameter is no longer needed._

```html
<wv-viewport wv-viewport-serie="id"></wv-viewport>
```

Standard controls can be used as well.

```html
<wv-viewport wv-viewport-serie="id" wv-viewport-mouse-events></wv-viewport>
```

_Notice **wv-viewport-serie** isn't written using the same nomenclature as **wv-instance**. Unlike **wv-instance**, **wv-viewport-serie** is not a **wv-viewport** parameter but rather an extension of **wv-viewport**._