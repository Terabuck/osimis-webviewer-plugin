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

        function create(id, instanceIds, tags) {
        	return new SerieModel(id, instanceIds, tags);
        }

        ////////////////

        function SerieModel(id, instanceIds, tags) {
            this.id = id;
            this.instanceIds = instanceIds;
            this.instanceCount = instanceIds.length;
            this.tags = tags;

            this.isPlaying = false;
            this._index = 0;
            this._playTimeout = null;
        };

        SerieModel.prototype.getActualInstanceId = function() {
           return this.instanceIds[this._index];
        };

        SerieModel.prototype.goToNextInstance = function(restartWhenSerieEnd) {
            if (restartWhenSerieEnd !== true) restartWhenSerieEnd = false;
            
            this._index++;

            if (this._index >= this.instanceCount) {
              this._index = restartWhenSerieEnd ? 0 : this.instanceCount - 1;
            }
        };

        SerieModel.prototype.goToPreviousInstance = function() {
            this._index--;

            if (this._index < 0) {
              this._index = 0;
            }
        };

        SerieModel.prototype.goToInstance = function(newIndex) {
            if (newIndex < 0) {
              newIndex = 0;
            }
            else if (newIndex + 1 > this.instanceCount) {
              return;
            }

            this._index = newIndex;
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
                _this.goToNextInstance(true);
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