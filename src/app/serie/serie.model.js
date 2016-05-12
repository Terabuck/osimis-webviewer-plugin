(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WvSerie', factory);

    /* @ngInject */
    function factory($rootScope, $timeout, wvAnnotationManager, WvAnnotationGroup) {

        function WvSerie(id, imageIds, tags) {
            var _this = this;

            this.id = id; // id == orthancId + ':' + subSerieIndex
            this.imageIds = imageIds;
            this.imageCount = imageIds.length;
            this.currentIndex = 0; // real index of the image, waiting loading to be shown
            this.currentShownIndex = 0; // index shown at the moment
            this.tags = tags;
            this.onCurrentImageIdChanged = new osimis.Listener();
            this.onAnnotationChanged = new osimis.Listener();

            // @note _annotationGroup is just a local cache for filtering
            // the real cache is handled by the wvAnnotationManager service
            this._annotationGroup = null;
            // invalidate cache on change
            wvAnnotationManager.onAnnotationChanged(function(annotation) {
                if (_this.imageIds.indexOf(annotation.imageId) !== -1) {
                    // invalidate the cache if the serie is concerned by the changed annotation
                    _this._annotationGroup = null;

                    // trigger the change
                    _this.onAnnotationChanged.trigger(annotation);
                }
            });
            // @todo unlisten

            this.isPlaying = false;
            this._playTimeout = null;
        };

        WvSerie.prototype._loadAnnotationGroup = function() {
            var _this = this;

            if (!this._annotationGroup) {
                // retrieve each kind of annotation for each image in the serie
                var annotations = [];
                this.imageIds.forEach(function(imageId) {
                    annotations.push(wvAnnotationManager.getByImageId(imageId));
                });

                // cache annotations
                this._annotationGroup = new WvAnnotationGroup(annotations);
            }

            return this._annotationGroup;
        }

        WvSerie.prototype.getAnnotedImageIds = function(type) {
            return this._loadAnnotationGroup()
                .filterByType(type)
                .getImageIds();
        };
        
        WvSerie.prototype.getAnnotationGroup = function(type) {
            return this._loadAnnotationGroup();
        };
        
        /** $serie.getAnnotations([type: string])
         *
         */
        WvSerie.prototype.getAnnotations = function(type) {
            var annotationGroup = this._loadAnnotationGroup();

            if (type) {
                annotationGroup.filterByType(type);
            }

            return annotationGroup.toArray();
        };

        WvSerie.prototype.getIndexOf = function(imageId) {
            return this.imageIds.indexOf(imageId);
        }

        WvSerie.prototype.setShownImage = function(id) {
            this.currentShownIndex = this.getIndexOf(id);
        };
        WvSerie.prototype.getCurrentImageId = function() {
           return this.imageIds[this.currentIndex];
        };

        WvSerie.prototype.goToNextImage = function(restartWhenSerieEnd) {
            restartWhenSerieEnd = restartWhenSerieEnd || false;

            if (this.currentIndex >= this.imageCount-1 && restartWhenSerieEnd) {
                this.currentIndex = 0;
                this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
            }
            else if (this.currentIndex < this.imageCount-1) {
                this.currentIndex++;
                this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
            }
            else {
                // Don't trigger event when nothing happens (the serie is already at its end)
            }
        };

        WvSerie.prototype.goToPreviousImage = function() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
            }
            else {
                // Don't trigger event when nothing happens (the serie is already at the first image)
            }
        };

        WvSerie.prototype.goToImage = function(newIndex) {
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
        WvSerie.prototype.play = function() {
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
        WvSerie.prototype.pause = function() {
            if (_cancelAnimationId) {
                cancelAnimationFrame(_cancelAnimationId);
                _cancelAnimationId = null;
            }

            this.isPlaying = false;
        };

        ////////////////

        return WvSerie;
    }

})();