# The serielist

The **wv-serielist** shows a vertical list of serie populated from a study. It provides a simple way to drag & drop series into viewports.

## Show a basic serielist

> - wv-serielist
> - (attr) wv-study-id: string (id)

Showing a **wv-serielist** is pretty straight forward.

```html
<wv-serielist wv-study="studyId"></wv-serielist>
```


## Drop serielist items into viewports

> - wv-viewport
> - (attr) wv-viewport-droppable: void
> - (attr) wv-viewport-draggable: void

**wv-viewport-droppable** attribute allows the **wv-viewport** to react to dropped **wv-viewport**.
_The **wv-serielist** lists **wv-viewport** with **wv-viewport-draggable** attribute to allow the viewports to be drag & dropped._

```html
<div class="wv-container">
    <div class="wv-menu">
        <wv-serielist wv-study="studyId"></wv-serielist>
    </div>
    <div class="wv-main" style="background-color: orange" wv-size-tag>
        <wv-viewport wv-width="'tag'" wv-height="'tag'" 
            wv-viewport-serie wv-scroll-on-wheel="true" wv-viewport-droppable
        ></wv-viewport>
    </div>
</div>
```

There are several things to notice in this example :

1. Neither **wv-viewport-serie** value nor **wv-instance** are defined. Those are not required in this case.
2. Since no instance is provided to the viewport, it is *imperative* to define **wv-width** and **wv-height**. When not defined, the dropzone size will be 0px x 0px and will be unusable.
3. The webviewer contains css classes *.wv-container*, *.wv-menu* and *.wv-main* which may be used to set up a simple layout.