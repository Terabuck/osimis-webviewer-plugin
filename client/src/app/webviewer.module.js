(function() {
  'use strict';

  var version = '0.2.9';

  /**
   * @ngdoc overview
   * @name osimiswebviewerApp
   * @description
   * # osimiswebviewerApp
   *
   * Main module of the application.
   */
  angular
  .module('webviewer', ['ngResource', 'ngSanitize', 'mgcrea.ngStrap', 'ngRangeFilter', 'debounce'])
  .constant('$', window.$)
  .constant('_', window._)
  .constant('pako', window.pako)
  .constant('JpegImage', window.JpegImage)
  .constant('hamster', window.Hamster)
  .constant('cornerstone', window.cornerstone)
  .constant('cornerstoneTools', window.cornerstoneTools)
  .provider('wvConfig', function() {
    var _config = {
      version: version,
      orthancApiURL: '',
      defaultCompression: '95'
    };

    this.setApiURL = function(url) {
      // Remove trailing slash
      if (url.substr(-1) === '/') {
        url = url.substr(0, url.length - 1);
      }

      _config.orthancApiURL = url;
    };

    this.$get = function() {
      return _config;
    };
  });

})();
