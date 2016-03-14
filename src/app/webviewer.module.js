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
      webviewerApiURL: 'web-viewer',
      defaultCompression: 'jpeg95'
    };

    this.setApiURL = function(url) {
      if (url.substr(-1) === '/') {
        url = url.substr(0, url.length - 1);
      }

      _config.orthancApiURL = url;
      _config.webviewerApiURL = url + '/web-viewer';
    };

    this.$get = function() {
      return _config;
    };
  })
  .config(['$httpProvider', function ($httpProvider) {
    /* @warning @note @todo
     *
     * this instruction cache every http requests.
     * It is only usable in prototypal context.
     */
    $httpProvider.defaults.cache = true;

    console.error('warning: cache is activated in the whole application');
  }]);

})();
