'use strict';

// @todo define angular var

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
  var defaultPath = _getScriptServerURL();
  var _config = {
    orthancApiURL: defaultPath,
    webviewerApiURL: defaultPath,
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

  function _getScriptServerURL() { // based on https://github.com/QueueHammer/codecraftsman.js/blob/master/codecraftsman.js
    var scriptPath = '';
    try {
      throw new Error();
    }
    catch(e) {
      var stackLines = e.stack.split('\n');
      var callerIndex = 0;
      for(var i in stackLines){
        if(!stackLines[i].match(/(?:resource|file|https?):\/\//)) continue;
        callerIndex = Number(i) + 2;
        break;
      }
      var pathParts = stackLines[callerIndex].match(/((?:resource|file|https?):\/\/(?:[\da-z\.:-])+)\/?.*\.js/);

      return pathParts[1];
    }
  }
});
