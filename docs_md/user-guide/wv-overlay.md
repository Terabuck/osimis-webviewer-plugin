# The overlay

The overlay purpose is to show interesting stuffs about many things, including among others:

- DICOM instance tags
- DICOM serie tags
- viewport parameters (such as zoom, scale, ...)

The previous user guide section demonstrate how to show or hide the default viewport's overlay.
This section aims to explain how to configure it.

## The wv-viewport content

By default, the **wv-viewport** shows a default overlay.

```html
<wv-viewport wv-width="width" wv-height="height" wv-instance="instanceId"></wv-viewport>

<!-- same as -->

<wv-viewport wv-width="width" wv-height="height" wv-instance="instanceId">
    <wv-overlay></wv-overlay>
</wv-viewport>
```

Adding nested content to the directive replace the default overlay by anything you want.

```html
<!-- useless customized overlay -->
<wv-viewport wv-width="width" wv-height="height" wv-instance="instanceId">
    <style>
    #topleft {
        position: absolute;
        top: 3px;
        left: 3px;

        background-color: yellow;
        color: black;
    }
    #bottomright {
        position: absolute;
        bottom: 3px;
        right: 3px;

        background-color: orange;
        color: white;
    }
    </style>

    <div id="topleft">
        Heee!
    </div>
    
    <div id="bottomright">
        Oooooh!
    </div>
</wv-viewport>
```

As you can see, the viewport is declared with the css _position: relative_. Absolute positioning can thus be used to define viewport areas.

The following css classes can also be used to define areas _(see wv-overlay.tpl.html source code)_. 

- .wv-overlay-topleft
- .wv-overlay-topright
- .wv-overlay-bottomleft
- .wv-overlay-bottomright


## Accessing the instance data

You might want to show interesting stuffs in your overlay.
Web Viewer Components use angular events to broadcast their informations to the overlay _(see the wv-overlay.js source code to learn more)_.

**wv-overlay** listens to some of these events and defines the following scope objects :

- $instance (contains the dicom instance tags)
- $viewport (contains the viewport parameters, more informations: https://github.com/chafey/cornerstone/wiki/viewport)
- $serie (contains the dicom serie tags, provided by **wv-viewport-serie**)
- $instanceCount (the number of instance in the serie, require **wv-viewport-serie** as well)

**wv-overlay-scrollbar** also adds a scrollbar to the bottom of the overlay.

```html
<!-- usefull costumized overlay -->
<wv-viewport wv-width="width" wv-height="height" wv-viewport-serie="serieId" wv-viewport-mouse-events wv-scroll-on-wheel="true">
    <style>
    #bottomright2 {
        position: absolute;
        bottom: 3px;
        right: 3px;

        background-color: orange;
        color: white;
    }
    </style>

    <wv-overlay>
        <div class="wv-overlay-topright">
            {{$instance.PatientName}}
        </div>
        
        <div id="bottomright2">
            wwwc: {{$viewport.voi.windowWidth}}/{{$viewport.voi.windowCenter}}<br/>
            zoom: {{$viewport.scale}}
        </div>

        <!-- one of a kind scrollbar -->
        <wv-overlay-scrollbar></wv-overlay-scrollbar>
    </wv-overlay>

</wv-viewport>

<!-- Note: the viewport default overlay can be shown this way as well -->
<wv-viewport wv-width="width" wv-height="height" wv-viewport-serie="serieId" wv-scroll-on-wheel="true">
    <wv-overlay></wv-overlay>
</wv-viewport>
```
