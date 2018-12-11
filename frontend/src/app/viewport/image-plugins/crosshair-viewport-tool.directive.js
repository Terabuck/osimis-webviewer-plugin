var synchronizer = new cornerstoneTools.Synchronizer("cornerstonenewimage", cornerstoneTools.updateImageSynchronizer);

(function($, cornerstone, cornerstoneTools) {

  'use strict';

  var toolType = 'crosshairsOsimis';

  function chooseLocation(e, eventData) {
      e.stopImmediatePropagation(); // Prevent CornerstoneToolsTouchStartActive from killing any press events
      
      // if we have no toolData for this element, return immediately as there is nothing to do
      var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
      if (!toolData) {
          return;
      }

      // Get current element target information
      var sourceElement = e.currentTarget;
      var sourceEnabledElement = cornerstone.getEnabledElement(sourceElement);
      var sourceImage = sourceEnabledElement.image;
      var sourceImageId = sourceEnabledElement.image.imageId;
      var sourceImagePlane = cornerstoneTools.metaData.get('imagePlane', sourceImageId);

      // Get currentPoints from mouse cursor on selected element
      var sourceImagePoint = eventData.currentPoints.image;

      // Transfer this to a patientPoint given imagePlane metadata
      var patientPoint = cornerstoneTools.imagePointToPatientPoint(sourceImagePoint, sourceImagePlane);

      // Get the enabled elements associated with this synchronization context
      var syncContext = toolData.data[0].synchronizationContext;
      var wvInstanceManager = toolData.data[0].wvInstanceManager;
      var wvReferenceLines = toolData.data[0].wvReferenceLines;
      var wvSeriesManager = toolData.data[0].wvSeriesManager;
      var wvPaneManager = toolData.data[0].wvPaneManager;
      var wvSynchronizer = toolData.data[0].wvSynchronizer;
      var enabledElements = syncContext.getSourceElements();

      // Iterate over each synchronized element
      $.each(enabledElements, function(index, targetElement) {
          // don't do anything if the target is the same as the source
          if (targetElement === sourceElement) {
              return; // Same as 'continue' in a normal for loop
          }

          var targetImage = cornerstone.getEnabledElement(targetElement).image;
          var targetImagePlane = cornerstoneTools.metaData.get('imagePlane', targetImage.imageId);

          // Make sure the target and reference actually have image plane metadata
          if (!targetImagePlane || !sourceImagePlane) {
            return;
          }

          // the image planes must be in the same frame of reference
          if (targetImagePlane.frameOfReferenceUID !== sourceImagePlane.frameOfReferenceUID) {
            return;
          }
      
          //wvInstanceManager.getInfos(sourceImage.imageId.split(":")[0]).then(function(sourceInstanceInfos) {
          wvInstanceManager.getInfos(targetImage.imageId.split(":")[0]).then(function(targetInstanceInfos) {
            var targetPanes = wvPaneManager.getPanesDisplayingSeries(targetInstanceInfos["SeriesOrthancId"] + ":0");

            if (targetPanes.length > 0)  {
              // wvSeriesManager.get(sourceInstanceInfos["SeriesOrthancId"] + ":0").then(function(sourceSeries) {
              //   wvSeriesManager.get(targetInstanceInfos["SeriesOrthancId"] + ":0").then(function(targetSeries) {
                  // console.log(sourceSeries, targetSeries);

              var minDistance = Number.MAX_VALUE;
              var newImageIndex = -1;

              // Find within the element's stack the closest image plane to selected location
              $.each(targetPanes[0].series.imageIds, function(index, imageId) {
                  var targetImagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
                  var targetImagePosition = targetImagePlane.imagePositionPatient;
                  var row = targetImagePlane.rowCosines.clone();
                  var column = targetImagePlane.columnCosines.clone();
                  var normal = column.clone().cross(row.clone());
                  var distance = Math.abs(normal.clone().dot(targetImagePosition) - normal.clone().dot(patientPoint));
                  // console.log(index + '=' + distance);
                  if (distance < minDistance) {
                      minDistance = distance;
                      newImageIndex = index;
                  }
              });

              if (newImageIndex != -1) {
                $.each(targetPanes, function(index, targetPane) {
                  console.log("changing displayed image in series: " + targetPane.series.id + " to " + newImageIndex);
                  targetPane.series.goToImage(newImageIndex);
                  wvSynchronizer.update(targetPane.series);
                  wvReferenceLines.update(targetPane.series);
                });
              }
            }
          });

          // var minDistance = Number.MAX_VALUE;
          // var newImageIdIndex = -1;

          // // Find within the element's stack the closest image plane to selected location
          // $.each(stackData.imageIds, function(index, imageId) {
          //     var imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
          //     var imagePosition = imagePlane.imagePositionPatient;
          //     var row = imagePlane.rowCosines.clone();
          //     var column = imagePlane.columnCosines.clone();
          //     var normal = column.clone().cross(row.clone());
          //     var distance = Math.abs(normal.clone().dot(imagePosition) - normal.clone().dot(patientPoint));
          //     //console.log(index + '=' + distance);
          //     if (distance < minDistance) {
          //         minDistance = distance;
          //         newImageIdIndex = index;
          //     }
          // });

          // if (newImageIdIndex === stackData.currentImageIdIndex) {
          //     return;
          // }

          // // Switch the loaded image to the required image
          // if (newImageIdIndex !== -1 && stackData.imageIds[newImageIdIndex] !== undefined) {
          //     var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
          //     var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
          //     var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

          //     if (startLoadingHandler) {
          //         startLoadingHandler(targetElement);
          //     }

          //     var loader;
          //     if (stackData.preventCache === true) {
          //         loader = cornerstone.loadImage(stackData.imageIds[newImageIdIndex]);
          //     } else {
          //         loader = cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]);
          //     }

          //     loader.then(function(image) {
          //         var viewport = cornerstone.getViewport(targetElement);
          //         stackData.currentImageIdIndex = newImageIdIndex;
          //         cornerstone.displayImage(targetElement, image, viewport);
          //         if (endLoadingHandler) {
          //             endLoadingHandler(targetElement);
          //         }
          //     }, function(error) {
          //         var imageId = stackData.imageIds[newImageIdIndex];
          //         if (errorLoadingHandler) {
          //             errorLoadingHandler(targetElement, imageId, error);
          //         }
          //     });
          // }
      });
  }

  function mouseUpCallback(e, eventData) {
      $(eventData.element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
      $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
  }

  function mouseDownCallback(e, eventData) {
      if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
          $(eventData.element).on('CornerstoneToolsMouseDrag', mouseDragCallback);
          $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
          chooseLocation(e, eventData);
          return false; // false = cases jquery to preventDefault() and stopPropagation() this event
      }
  }

  function mouseDragCallback(e, eventData) {
      chooseLocation(e, eventData);
      return false; // false = causes jquery to preventDefault() and stopPropagation() this event
  }

  function activate(element, mouseButtonMask, wvInstanceManager, wvReferenceLines, wvSynchronizer, wvSeriesManager, wvPaneManager) {
    enable(element, mouseButtonMask, wvInstanceManager, wvReferenceLines, wvSynchronizer, wvSeriesManager, wvPaneManager)
  }

  function enable(element, mouseButtonMask, wvInstanceManager, wvReferenceLines, wvSynchronizer, wvSeriesManager, wvPaneManager) {
      var eventData = {
          mouseButtonMask: mouseButtonMask,
      };
      
      // Clear any currently existing toolData
      var toolData = cornerstoneTools.getToolState(element, toolType);
      toolData = [];

      cornerstoneTools.addToolState(element, toolType, {
        wvInstanceManager: wvInstanceManager,
        wvReferenceLines: wvReferenceLines,
        wvSeriesManager: wvSeriesManager,
        wvSynchronizer: wvSynchronizer,
        wvPaneManager: wvPaneManager,
        synchronizationContext: synchronizer
      });

      $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);

      $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
  }

  function deactivate(element) {
    disable(element);
  }
  // disables the reference line tool for the given element
  function disable(element) {
      $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  }

  // module/private exports
  cornerstoneTools.crosshairsOsimis = {
      activate: activate,
      deactivate: deactivate,
      enable: enable,
      disable: disable
  };

  function dragEndCallback(e, eventData) {
      $(eventData.element).off('CornerstoneToolsTouchDrag', dragCallback);
      $(eventData.element).off('CornerstoneToolsDragEnd', dragEndCallback);
  }

  function dragStartCallback(e, eventData) {
      $(eventData.element).on('CornerstoneToolsTouchDrag', dragCallback);
      $(eventData.element).on('CornerstoneToolsDragEnd', dragEndCallback);
      chooseLocation(e, eventData);
      return false;
  }

  function dragCallback(e, eventData) {
      chooseLocation(e, eventData);
      return false; // false = causes jquery to preventDefault() and stopPropagation() this event
  }

  function enableTouch(element, synchronizationContext) {
      // Clear any currently existing toolData
      var toolData = cornerstoneTools.getToolState(element, toolType);
      toolData = [];

      cornerstoneTools.addToolState(element, toolType, {
          synchronizationContext: synchronizationContext,
          // TODO
      });

      $(element).off('CornerstoneToolsTouchStart', dragStartCallback);

      $(element).on('CornerstoneToolsTouchStart', dragStartCallback);
  }

  // disables the reference line tool for the given element
  function disableTouch(element) {
      $(element).off('CornerstoneToolsTouchStart', dragStartCallback);
  }

  cornerstoneTools.crosshairsOsimisTouch = {
      activate: enableTouch,
      deactivate: disableTouch,
      enable: enableTouch,
      disable: disableTouch
  };

})($, cornerstone, cornerstoneTools);

(function () {
  'use strict';

  angular
    .module('webviewer')
    .directive('wvCrossHairViewportTool', wvCrossHairViewportTool)
    .config(function ($provide) {
      $provide.decorator('wvViewportDirective', function ($delegate) {
        var directive = $delegate[0];
        directive.require['wvCrossHairViewportTool'] = '?^wvCrossHairViewportTool';

        return $delegate;
      });
    });

  /* @ngInject */
  function wvCrossHairViewportTool($parse, WvBaseTool, wvInstanceManager, wvReferenceLines, wvSynchronizer, wvSeriesManager, wvPaneManager) {
    // Usage:
    //
    // Creates:
    //
    var directive = {
      require: 'wvCrossHairViewportTool',
      controller: Controller,
      link: link,
      restrict: 'A',
      scope: false
    };

    function link(scope, element, attrs, tool) {
      var wvCrossHairViewportToolParser = $parse(attrs.wvCrossHairViewportTool);


      // bind attributes -> tool
      scope.$watch(wvCrossHairViewportToolParser, function (isActivated) {
        if (isActivated) {
          tool.activate();
        }
        else {
          tool.deactivate();
        }
      });
    }

    /* @ngInject */
    function Controller(wvPanViewportTool, wvZoomViewportTool, $scope) {
      WvBaseTool.call(this, 'crosshairsOsimis', 'crosshairsOsimisTouch', false, wvPanViewportTool, wvZoomViewportTool, $scope);

    }
    Controller.prototype = Object.create(WvBaseTool.prototype)
    Controller.prototype.constructor = Controller;

    // BaseTool class as been made for annotation. This is not one.
    // We overide this method so the glass is not shown once toggled
    // off. When we deactivate an annotation, we let the annotation
    // shown, but only deactivate the inputs.
    // For tools related to cornerstone (@todo split BaseTool in AnnotationTools & others)
    Controller.prototype._activateInputs = function (viewport) {
      var enabledElement = viewport.getEnabledElement();
      //        WvBaseTool.prototype._activateInputs.call(this, viewport);

      // Listen to events
      cornerstoneTools.mouseInput.enable(enabledElement);
      cornerstoneTools.touchInput.enable(enabledElement);


      synchronizer.add(enabledElement);
      cornerstoneTools[this.toolName].activate(enabledElement, 1, wvInstanceManager, wvReferenceLines, wvSynchronizer, wvSeriesManager, wvPaneManager);
      if (this.toolName2) {
        cornerstoneTools[this.toolName2].activate(enabledElement, synchronizer);
      }

    };

    Controller.prototype._deactivateInputs = function (viewport) {
      var enabledElement = viewport.getEnabledElement();
      synchronizer.remove(enabledElement);

      WvBaseTool.prototype._deactivateInputs.call(this, viewport);
    };

    return directive;
  }

})();