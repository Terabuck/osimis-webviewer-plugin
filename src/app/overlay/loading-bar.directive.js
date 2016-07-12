(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvLoadingBar', wvLoadingBar);

    /* @ngInject */
    function wvLoadingBar() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            templateNamespace: 'svg',
            replace: true, // required for svg databinding
            templateUrl: 'app/overlay/loading-bar.directive.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
            	series: '=wvSeries'
            }
        };
        return directive;

        function link(scope, element, attrs) {
            scope.vm.imageQualities = [];
        }
    }

    /* @ngInject */
    function Controller($scope, wvImageBinaryManager, WvImageQualities) {
        var _this = this;

        // [<image index>: [<image quality: int>,...] , ...] - image-index != image-id
        this.imageQualities = [];
        // [<image index>: <image quality: int> , ...] - image-index != image-id
        this.bestQualityByImage = [];

        this.QualityKeys = _.invert(WvImageQualities);

        // $scope.$watch('vm.series.id', function(seriesId) {

        // });

        // Show current loading image
        this.currentImageIndex = null;
        $scope.$watch('vm.series', function(newSeries, oldSeries) {
            // Unbind the old series if exists
            if (oldSeries) {
                // Close listeners
                oldSeries.onCurrentImageIdChanged.close(_this);

                // Clean the datas
                _this.imageQualities = [];
                _this.imageCount = 0;
                _this.imageBarWidth = 0;
            }

            // Set the new series if exists
            if (newSeries) {
                // Set actual image
                _this.currentImageIndex = newSeries.currentIndex;

                // Set bar size
                _this.imageCount = newSeries.imageCount;
                _this.imageBarWidth = 100 / _this.imageCount; // in percentage

                // Listen to actual image
                newSeries.onCurrentImageIdChanged(_this, function(imageId) {
                    _this.currentImageIndex = newSeries.getIndexOf(imageId);
                });
                // @todo close on destroy

                // Retrieve already cached series' image list
                _this.imageQualities = newSeries.listCachedImageBinaries();

                // Get the best quality of each image so we can draw its color
                _this.bestQualityByImage = _this
                    .imageQualities
                    .map(function(imageQualities) {
                        // Get the highest imageQuality number
                        var bestQuality = imageQualities.reduce(function(previous, current) {
                            if (previous === null || current > previous) {
                                return current;
                            }
                            else {
                                return previous;
                            }
                        }, null);

                        return bestQuality;
                    });
            }

            // _this.series is updated via databinding (_this.series === $scope.vm.series)
        });

        wvImageBinaryManager.onBinaryLoaded(_this, function(imageId, imageQuality) {
            // Be sure a series is available
            var series = _this.series;
            if (!series) {
                return;
            }

            // Filter the current series
            var imageIndex = series.getIndexOf(imageId);
            if (imageIndex === -1) {
                return;
            }

            // Create the array of available qualities
            // if (!_this.imageQualities[imageIndex]) {
            //     _this.imageQualities[imageIndex] = [];
            // }

            // Store the quality
            _this.imageQualities[imageIndex].push(imageQuality);
            // Recalculate the best quality in cache
            if (!_this.bestQualityByImage[imageIndex] || imageQuality > _this.bestQualityByImage[imageIndex]) {
                _this.bestQualityByImage[imageIndex] = imageQuality;
            }
        });
        wvImageBinaryManager.onBinaryUnLoaded(_this, function(imageId, imageQuality) {
            // Be sure a series is available
            var series = _this.series;
            if (!series) {
                return;
            }

            // Filter the current series
            var imageIndex = series.getIndexOf(imageId);
            if (imageIndex === -1) {
                return;
            }

            // Unstore the unloaded quality
            _.pull(_this.imageQualities[imageIndex], imageQuality);
            // Recalculate the best quality in cache
            _this.bestQualityByImage = _this
                .imageQualities
                .map(function(imageQualities) {
                    // Get the highest imageQuality number
                    var bestQuality = imageQualities.reduce(function(previous, current) {
                        if (previous === null || current > previous) {
                            return current;
                        }
                        else {
                            return previous;
                        }
                    }, null);

                    return bestQuality;
                });
        });

        $scope.$on('$destroy', function() {
            wvImageBinaryManager.onBinaryLoaded.close(_this);
            wvImageBinaryManager.onBinaryUnLoaded.close(_this);
        });

    }

    Controller.prototype._listenSeries = function() {
        // Register events
    };

    Controller.prototype._unlistenSeries = function() {
        // Unregister events
    };
})();