(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WvSeries', factory);

    /* @ngInject */
    function factory($rootScope, $timeout, wvAnnotationManager, WvAnnotationGroup, wvImageBinaryManager) {

        function WvSeries(id, imageIds, tags, availableQualities) {
            var _this = this;

            this.id = id; // id == orthancId + ':' + subSeriesIndex
            this.imageIds = imageIds;
            this.imageCount = imageIds.length;
            this.currentIndex = 0; // real index of the image, waiting loading to be shown
            this.currentShownIndex = 0; // index shown at the moment
            this.tags = tags;
            this.availableQualities = availableQualities;
            this.onCurrentImageIdChanged = new osimis.Listener();
            this.onAnnotationChanged = new osimis.Listener();

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
        WvSeries.prototype.play = function() {
            var _this = this;

            // Do nothing when there is only one image
            if (this.imageCount < 2) {
                return;
            }

            var speed = 1000 / this.tags.RecommendedDisplayFrameRate || 1000 / 30; // 30 fps by default

            if (this.isPlaying) {
                return;
            }

            var _lastMsTime = null;
            var _toSkip = 0;
            (function loop() {
                _cancelAnimationId = requestAnimationFrame(function(msTime) {
                    // force skipping useless frames
                    if (_toSkip) {
                        --_toSkip;
                    }
                    else {
                        var fps = 1000 / (msTime - _lastMsTime);
                        _toSkip = Math.round(fps / speed);

                        $rootScope.$apply(function() {
                            _this.goToNextImage(true);
                        });
                    }

                    _lastMsTime = msTime;
                    
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