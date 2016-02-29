(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSerie', wvSerie);

    /* @ngInject */
    function wvSerie($timeout) {
        var service = {
            create: create,
            class: SerieModel
        };

        ////////////////

        function create(id, imageIds, tags) {
        	return new SerieModel(id, imageIds, tags);
        }

        ////////////////

        function SerieModel(id, imageIds, tags) {
            this.id = id; // id == orthancId + ':' + subSerieIndex
            this.imageIds = imageIds;
            this.imageCount = imageIds.length;
            this.currentIndex = 0;
            this.tags = tags;
            this.onCurrentImageIdChanged = new osimis.Listener();

            this.isPlaying = false;
            this._playTimeout = null;
        };

        SerieModel.prototype.getCurrentImageId = function() {
           return this.imageIds[this.currentIndex];
        };

        SerieModel.prototype.goToNextImage = function(restartWhenSerieEnd) {
            if (restartWhenSerieEnd !== true) restartWhenSerieEnd = false;
            
            this.currentIndex++;

            if (this.currentIndex >= this.imageCount) {
              this.currentIndex = restartWhenSerieEnd ? 0 : this.imageCount - 1;
            }

            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId());
        };

        SerieModel.prototype.goToPreviousImage = function() {
            this.currentIndex--;

            if (this.currentIndex < 0) {
              this.currentIndex = 0;
            }

            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId());
        };

        SerieModel.prototype.goToImage = function(newIndex) {
            if (newIndex < 0) {
              newIndex = 0;
            }
            else if (newIndex + 1 > this.imageCount) {
              return;
            }

            this.currentIndex = newIndex;
            this.onCurrentImageIdChanged.trigger(this.getCurrentImageId());
        };

        SerieModel.prototype.play = function(speed) {
            if (this.isPlaying) return;

            if (speed) {
              this.playAtSpeed(speed);
            }
            else {
              var mmPerSeconds = 25;
              this.playAtRate(mmPerSeconds);
            }
        };

        SerieModel.prototype.pause = function() {
            if (this._playTimeout) {
              $timeout.cancel(this._playTimeout);
              this._playTimeout = null;
            }

            this.isPlaying = false;
        };

        SerieModel.prototype.playAtSpeed = function(speed) {
            var _this = this;

            this._playTimeout = $timeout(function() {
                _this.goToNextImage(true);
                if (_this.isPlaying) {
                    _this.playAtSpeed(speed);
                }
            }, speed);
            
            this.isPlaying = true;
        };

        SerieModel.prototype.playAtRate = function(rate) {
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

        return service;
    }


})();