(function() {
    'use strict';

    var version = '0.5.1';

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
            version: {
                frontend: version,
                plugin: null,
                orthanc: null,
                db: null
            },
            orthancApiURL: ''
        };

        this.setApiURL = function(url) {
            // Remove trailing slash
            if (url.substr(-1) === '/') {
                url = url.substr(0, url.length - 1);
            }

            _config.orthancApiURL = url;
        };

        this.$get = function($http, $q) {
            // Check version compatibility between the frontend and the plugin
            var pluginInfo = $http.get(_config.orthancApiURL + '/plugins/osimis-web-viewer');
            var orthancInfo = $http.get(_config.orthancApiURL + '/system');

            $q.all({
                plugin: pluginInfo,
                orthanc: orthancInfo
            })
            .then(function(result) {
                var plugin = result.plugin;
                var orthanc = result.orthanc;

                _config.version.plugin = plugin.data.Version;
                _config.version.orthanc = orthanc.data.Version;
                _config.version.db = orthanc.data.DatabaseVersion;

                // Compare minor and major versions
                var semverRegex = /^v?(\d+)\.(\d+)\.\d+/;
                var frontendVersionMatch = semverRegex.exec(_config.version.frontend);
                var pluginVersionMatch = semverRegex.exec(_config.version.plugin);
                var isMajorVersionEqual = (frontendVersionMatch[1] == pluginVersionMatch[1]);
                var isMinorVersionCompatible = frontendVersionMatch[2] <= pluginVersionMatch[2];
                if (!isMajorVersionEqual || !isMinorVersionCompatible) {
                    // Reject promise on uncompatibility
                    return $q.reject('frontend version ' + _config.version.frontend +
                        ' is incompatible with the plugin version ' + _config.version.plugin);
                }

            }, function(err) {
                // Request failed
                // should never thrown because inside of a promise - !but! angular uses $q.reject instead
                throw new Error('unable to find orthanc/osimis-web-viewer plugin');
            })
            .then(null, function(err) {
                // Incompatible versions

                throw new Error(err);
            });

            return _config;
        };
    });

})();
