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
    this.instanceIndex = 0;
    this.toolbar = {};

    // Model: list series
    orthanc
    .serie.query()
    .$promise
    .then(function(series) {
      console.log('Available series ids:');
      console.table(_.without(series, ['$promise', '$resolved']), ['id']);
    });
}]);
