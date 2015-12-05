'use strict';

/**
 * @ngdoc function
 * @name osimiswebviewerApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the osimiswebviewerApp
 */
angular.module('osimiswebviewerApp')
.controller('MainCtrl', ['$interval', 'orthanc', function($interval, orthanc) {
    var self = this;

    this.serieId = '5a45bfac-36d99323-bea29308-f7082c12-ee76150b';
    var instances = [ ];
    this.imageIndex = 0;
    this.toolbar = {};
    this.overlayData = {};

    // Model: list series
    // orthanc
    // .serie.query()
    // .$promise
    // .then(function(hoho) {
    //   console.log(self.hoho);
    //   self.hoho = hoho;
    //   console.log(self.hoho);
    // });
    
    // Model: get serie & list images (instances)
    orthanc
    .serie.get({id: self.serieId})
    .$promise
    .then(function(volume) {
      instances = volume.Instances;
      if (instances.length > self.imageIndex) {
        self.imageId = instances[self.imageIndex];
      }
      //_autoplay();
    });

    function _autoplay() {
      var promise = $interval(function() {
        // AUTO PLAY Serie
        ++self.imageIndex;

        // AUTO PLAY Image
        self.imageId = instances[self.imageIndex];

        // STOP AT END
        if (self.imageIndex >= instances.length - 1) {
          $interval.cancel(promise);
        }
      }, 100);
    }
}]);
