(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WvSeries', factory);

    /* @ngInject */
    function factory($rootScope, $timeout, wvImageManager, wvAnnotationManager, WvAnnotationGroup, wvImageBinaryManager) {

        function WvSeries(id, imageIds, tags, availableQualities) {
            var _this = this;

            this.id = id; // id == orthancId + ':' + subSeriesIndex
            this.imageIds = imageIds;
            this.imageCount = imageIds.length;
            this.currentIndex = 0; // real index of the image, waiting loading to be shown
            this.currentShownIndex = 0; // index shown at the moment
            // @warning Those are all the tags of the middle instance of the orthanc series!
            // Multiframe instance may cause mismatch since one orthanc multiframe instance is one frontend series.
            // For instance we can't rely on this for framerate but only on tags common to an orthanc series.
            this.tags = tags;
            this.availableQualities = availableQualities;
            this.onCurrentImageIdChanged = new osimis.Listener();
            this.onAnnotationChanged = new osimis.Listener();

            // Set the framerate
            $timeout(function() {
                _this.frameRate = 30; // 30 FPS by default
                // Retrieve the image from the center of the series (to be sure the framerate is defined)
                var middleImageId = _this.imageIds[Math.floor(_this.imageIds.length/2)];

                // Put the request within a $timeout since the imageManager requires the series to be loaded
                // for optimization reason, and the series requires the image to be loaded to gather
                // its DICOM tag.
                // It is a temporary fix due to the osimis-viewer series requests returning the tags
                // of the middle instance of an orthanc series.
                // Due to the multiframe DICOM instance differences with monoframe DICOM instances, 
                // osimis-viewer uses an alternative model working for both.
                // @todo series route should return the tags of the middle instance of a osimis-viewer series instead
                wvImageManager 
                    .get(middleImageId)
                    .then(function(image) {
                        if (image.tags.RecommendedDisplayFrameRate) {
                            _this.frameRate = image.tags.RecommendedDisplayFrameRate;
                        }
                    });
            });

            // @note _annotationGroup is just a local cache for filtering
            // the real cache is handled by the wvAnnotationManager service
            this._annotationGroup = null;
            // invalidate cache on change
            wvAnnotationManager.onAnnotationChanged(function(annotation) {
                if (_this.imageIds.indexOf(annotation.imageId) !== -1) {
                    // invalidate the cache if the series is concerned by the changed annotation
                    _this._annotationGroup = null;

                    // trigger the change
                    _this.onAnnotationChanged.trigger(annotation);
                }
            });
            // @todo unlisten

            this.isPlaying = false;
            this._playTimeout = null;
        };

        /** WvSeries#listInstanceIds()
         *
         * List instances (and not images)
         *
         * @return [instanceId: String, ...]
         *
         */
        WvSeries.prototype.listInstanceIds = function() {
            var instanceIds = [];
            var previousInstanceId = null;

            // Take instanceIds from imageIds
            // @note this._imageIds is sorted
            for (var i=0; i<this.imageIds.length; ++i) {
                var imageId = this.imageIds[i];
                var splittedId = imageId.split(':');
                var instanceId = splittedId[0];

                if (instanceId === previousInstanceId) {
                    continue;
                }
                else {
                    instanceIds.push(instanceId);
                    previousInstanceId = instanceId;
                }
            }

            return instanceIds;
        };

        /** WvSeries#hasQuality(quality: int)
         *
         * @return bool
         *
         */
        WvSeries.prototype.hasQuality = function(quality) {
            // Seek quality in this.availableQualities
            for (var name in this.availableQualities) {
                var availableQuality = this.availableQualities[name];
                if (availableQuality === quality) {
                    return true;
                }
            }

            // Quality not found
            return false;
        };

        /** WvSeries#getCachedImageBinaries()
         *
         * @return [<image-index>: [<quality-value>, ...], ...]
         *
         */
        WvSeries.prototype.listCachedImageBinaries = function() {
            var _this = this;

            // For each image of the series -> list binaries in cache
            return this.imageIds
                .map(function(imageId, imageIndex) {
                    return wvImageBinaryManager.listCachedBinaries(imageId);
                });
        };

        WvSeries.prototype.getAnnotedImageIds = function(type) {
            return this._loadAnnotationGroup()
                .filterByType(type)
                .getImageIds();
        };
        
        WvSeries.prototype.getAnnotationGroup = function(type) {
            return this._loadAnnotationGroup();
        };
        
        /** $series.getAnnotations([type: string])
         *
         */
        WvSeries.prototype.getAnnotations = function(type) {
            var annotationGroup = this._loadAnnotationGroup();

            if (type) {
                annotationGroup.filterByType(type);
            }

            return annotationGroup.toArray();
        };

        WvSeries.prototype.getIndexOf = function(imageId) {
            return this.imageIds.indexOf(imageId);
        }

        WvSeries.prototype.setShownImage = function(id) {
            this.currentShownIndex = this.getIndexOf(id);
        };
        WvSeries.prototype.getCurrentImageId = function() {
           return this.imageIds[this.currentIndex];
        };

        WvSeries.prototype.getCurrentImage = function() {
            var imageId = this.getCurrentImageId();
            return wvImageManager.get(imageId);
        };

        WvSeries.prototype.goToNextImage = function(restartWhenSeriesEnd) {
            restartWhenSeriesEnd = restartWhenSeriesEnd || false;

            if (this.currentIndex >= this.imageCount-1 && restartWhenSeriesEnd) {
                this.currentIndex = 0;
                this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
            }
            else if (this.currentIndex < this.imageCount-1) {
                this.currentIndex++;
                this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
            }
            else {
                // Don't trigger event when nothing happens (the series is already at its end)
            }
        };

        WvSeries.prototype.goToPreviousImage = function() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
            }
            else {
                // Don't trigger event when nothing happens (the series is already at the first image)
            }
        };

        WvSeries.prototype.goToImage = function(newIndex) {
            if (newIndex < 0) {
              newIndex = 0;
            }
            else if (newIndex + 1 > this.imageCount) {
              return;
            }

            // Do nothing when the image do not change
            if (this.currentIndex == newIndex) {
                return;
            }

            this.currentIndex = newIndex;
            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
        };

        var _cancelAnimationId = null;
        var _timeLog;
        WvSeries.prototype.play = function() {
            var _this = this;

            // Do nothing when there is only one image
            if (this.imageCount < 2) {
                return;
            }

            if (this.isPlaying) {
                return;
            }

            var _lastTimeInMs = null;

            // Benchmark play loop
            if (console.time && console.timeEnd) {
                _timeLog = 'play (expect ? ms)';
                // console.time(_timeLog);
            }

            // Create recursive closure to display each images
            (function loop() {
                var desiredFrameRateInMs = 1000 / _this.frameRate; // Convert framerate FPS into MS
                // Wait for the monitor to attempt refresh
                _cancelAnimationId = requestAnimationFrame(function(currentTimeInMs) {
                    // Draw series at desired framerate (wait for the desired framerate ms time to be passed,
                    // skip displaying till it has not passed)
                    if (currentTimeInMs - _lastTimeInMs >= desiredFrameRateInMs) {
                        $rootScope.$apply(function() {
                            // Go to next image
                            _this.goToNextImage(true);

                            // Benchmark play loop
                            if (console.time && console.timeEnd) {
                                // console.timeEnd(_timeLog);
                                _timeLog = 'play (expect ' + Math.round(desiredFrameRateInMs) + 'ms)';
                                // console.time(_timeLog);
                            }
                            
                            // Track current time to calculate Frame Rate
                            _lastTimeInMs = currentTimeInMs;
                        });
                    }
                    
                    // Loop
                    if (_this.isPlaying) {
                        loop();
                    }
                });
            })();
            
            this.isPlaying = true;
        };

        WvSeries.prototype.pause = function() {
            if (_cancelAnimationId) {
                cancelAnimationFrame(_cancelAnimationId);
                _cancelAnimationId = null;

                // Stop benchmarking play loop
                if (console.time && console.timeEnd) {
                    // console.timeEnd(_timeLog);
                    _timeLog = 'play (expect ? ms)';
                }
            }

            this.isPlaying = false;
        };

        WvSeries.prototype._loadAnnotationGroup = function() {
            var _this = this;

            if (!this._annotationGroup) {
                // retrieve each kind of annotation for each image in the series
                var annotations = [];
                this.imageIds.forEach(function(imageId) {
                    annotations.push(wvAnnotationManager.getByImageId(imageId));
                });

                // cache annotations
                this._annotationGroup = new WvAnnotationGroup(annotations);
            }

            return this._annotationGroup;
        };
        
        ////////////////

        return WvSeries;
    };

})();