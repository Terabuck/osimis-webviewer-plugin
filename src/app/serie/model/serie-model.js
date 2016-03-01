(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVSerieModel', factory);

    /* @ngInject */
    function factory($timeout) {

        function WVSerieModel(id, imageIds, tags) {
            this.id = id; // id == orthancId + ':' + subSerieIndex
            this.imageIds = imageIds;
            this.imageCount = imageIds.length;
            this.currentIndex = 0; // real index of the image, waiting loading to be shown
            this.currentShownIndex = 0; // index shown at the moment
            this.tags = tags;
            this.onCurrentImageIdChanged = new osimis.Listener();

            this.isPlaying = false;
            this._playTimeout = null;
        };

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

        WVSerieModel.prototype.play = function(speed) {
            if (this.isPlaying) return;

            if (speed) {
              this.playAtSpeed(speed);
            }
            else {
              var mmPerSeconds = 25;
              this.playAtRate(mmPerSeconds);
            }
        };

        WVSerieModel.prototype.pause = function() {
            if (this._playTimeout) {
              $timeout.cancel(this._playTimeout);
              this._playTimeout = null;
            }

            this.isPlaying = false;
        };

        WVSerieModel.prototype.playAtSpeed = function(speed) {
            var _this = this;

            this._playTimeout = $timeout(function() {
                _this.goToNextImage(true);
                if (_this.isPlaying) {
                    _this.playAtSpeed(speed);
                }
            }, speed);
            
            this.isPlaying = true;
        };

        WVSerieModel.prototype.playAtRate = function(rate) {
            this.playAtSpeed(50);
            // @todo require instance datas
            // @note very approximative algorithm to automaticaly set speed
            
            // elementScope.$broadcast('viewport:GetInstanceData', function(tags) {
            //   if (!tags) return;

            //   // @todo calculate SpacingBetweenSlices using positions and orientation...
            //   var size = +tags.SliceThickness + (+tags.SpacingBetweenSlices || 0); 
            //   var fps = mmPerSeconds / size;
            //   var speed = Math.round(1000 / fps);

            //   nextTimeout = $timeout(function() {
            //     _showNextInstance(true);
            //     if (playing)
            //       scope.$evalAsync(processNextIterationCalculatedSpeed);
            //   }, speed);
            // });
        };

        ////////////////

        return WVSerieModel;
    }

})();