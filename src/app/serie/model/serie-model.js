(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVSerieModel', factory);

    /* @ngInject */
    function factory($timeout, wvAnnotation, WVAnnotationGroup) {

        function WVSerieModel(id, imageIds, tags) {
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
            // the real cache is handled by the wvAnnotation service
            this._annotationGroup = null;
            // invalidate cache on change
            wvAnnotation.onAnnotationChanged(function(annotation) {
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

        WVSerieModel.prototype._loadAnnotationGroup = function() {
            var _this = this;

            if (!this._annotationGroup) {
                // retrieve each kind of annotation for each image in the serie
                var annotations = [];
                this.imageIds.forEach(function(imageId) {
                    annotations.push(wvAnnotation.getByImageId(imageId));
                });

                // cache annotations
                this._annotationGroup = new WVAnnotationGroup(annotations);
            }

            return this._annotationGroup;
        }

        WVSerieModel.prototype.getAnnotedImageIds = function(type) {
            return this._loadAnnotationGroup()
                .filterByType(type)
                .getImageIds();
        };
        
        WVSerieModel.prototype.getAnnotationGroup = function(type) {
            return this._loadAnnotationGroup();
        };
        
        /** $serie.getAnnotations([type: string])
         *
         */
        WVSerieModel.prototype.getAnnotations = function(type) {
            var annotationGroup = this._loadAnnotationGroup();

            if (type) {
                annotationGroup.filterByType(type);
            }

            return annotationGroup.toArray();
        };

        WVSerieModel.prototype.getIndexOf = function(imageId) {
            return this.imageIds.indexOf(imageId);
        }

        WVSerieModel.prototype.setShownImage = function(id) {
            this.currentShownIndex = this.getIndexOf(this.imageIds);
        };
        WVSerieModel.prototype.getCurrentImageId = function() {
           return this.imageIds[this.currentIndex];
        };

        WVSerieModel.prototype.goToNextImage = function(restartWhenSerieEnd) {
            if (restartWhenSerieEnd !== true) restartWhenSerieEnd = false;
            
            this.currentIndex++;

            if (this.currentIndex >= this.imageCount) {
              this.currentIndex = restartWhenSerieEnd ? 0 : this.imageCount - 1;
            }

            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
        };

        WVSerieModel.prototype.goToPreviousImage = function() {
            this.currentIndex--;

            if (this.currentIndex < 0) {
              this.currentIndex = 0;
            }

            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
        };

        WVSerieModel.prototype.goToImage = function(newIndex) {
            if (newIndex < 0) {
              newIndex = 0;
            }
            else if (newIndex + 1 > this.imageCount) {
              return;
            }

            this.currentIndex = newIndex;
            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId(), this.setShownImage.bind(this));
        };

        var _cancelAnimationId = null;
        WVSerieModel.prototype.play = function(speed) {
            var _this = this;

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

                        _this.goToNextImage(true);
                    }

                    _lastMsTime = msTime;
                    
                    if (_this.isPlaying) {
                        loop();
                    }
                });
            })();
            
            this.isPlaying = true;
        };
        WVSerieModel.prototype.pause = function() {
            if (_cancelAnimationId) {
                cancelAnimationFrame(_cancelAnimationId);
                _cancelAnimationId = null;
            }

            this.isPlaying = false;
        };

        ////////////////

        return WVSerieModel;
    }

})();