(function() {
  'use strict';

  var version = '0.2.7';

  /**
   * @ngdoc overview
   * @name osimiswebviewerApp
   * @description
   * # osimiswebviewerApp
   *
   * Main module of the application.
   */
  angular
  .module('webviewer', ['ngResource', 'ngSanitize', 'mgcrea.ngStrap', 'ngRangeFilter'])
  .provider('wvConfig', function() {
    var _config = {
      version: version,
      orthancApiURL: '/',
      webviewerApiURL: '/web-viewer',
      defaultCompression: 'jpeg95'
    };

    this.setApiURL = function(url) {
      if (url.substr(-1) === '/') {
        url = url.substr(0, url.length - 1);;
      }

      _config.orthancApiURL = url;
      _config.webviewerApiURL = url + '/web-viewer';
    };

    this.$get = function() {
      return _config;
    };
  });

})();
