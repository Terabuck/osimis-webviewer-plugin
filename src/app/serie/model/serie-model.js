(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVSerieModel', factory);

    /* @ngInject */
    function factory($timeout, wvAnnotation) {

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

            this._annotationCache = null;

            wvAnnotation.onAnnotationChanged(function(annotation) {
                // @todo need to be destroyed on no listener anymore.

                // if the serie contains the annotation's image
                if (_this.imageIds.indexOf(annotation.imageId) === -1) return;
                
                _this._annotationCache = null;
                
                // trigger the change
                _this.onAnnotationChanged.trigger(annotation);
            });

            this.isPlaying = false;
            this._playTimeout = null;
        };

        WVSerieModel.prototype.getAnnotedImageIds = function(type) {
            return this.getAnnotations(type)
                .reduce(function(result, annotationGroup) {
                    var imageId = annotationGroup.imageId;
                    
                    if (result.indexOf(imageId) === -1) {
                        result.push(imageId);
                    }

                    return result;
                }, []);
        };

        WVSerieModel.prototype.getAnnotations = function(type) {
            if (!this._annotationCache) {
                this._annotationCache = _(this.imageIds)
                    .flatMap(function(imageId) {
                        return wvAnnotation.getByImageId(imageId, type);
                    })
                    .filter(function(annotations) {
                        return !!annotations;
                    })
                    .value()
            }
            return this._annotationCache;
        };

        WVSerieModel.prototype.getIndexOf = function(imageId) {
            return this.imageIds.indexOf(imageId);
        }

        WVSerieModel.prototype.setShownImage = function(id) {
            this.currentShownIndex = _.indexOf(this.imageIds, id);
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