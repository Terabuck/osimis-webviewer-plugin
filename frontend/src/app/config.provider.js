/**
 * @ngdoc service
 *
 * @name wvConfig
 *
 * @description
 * The `wvConfig` provider is used:
 *   * To retrieve/configure the Orthanc's path.
 *   * To retrieve the web-viewer version.
 *
 * Warning: Web Viewer is uncompatible with <base> HTML element (due to SVG/XLink issue)! Don't use it!
 *
 * @example
 * The following example show how to use the `wvConfig` provider to set the Orthanc's path,
 *
 * ```js
 * angular.module('new-module', ['webviewer'])
 * .config(function($locationProvider, wvConfigProvider) {
 *     wvConfigProvider.setApiURL('http://my-orthanc-url:8042/');
 *     wvConfigProvider.setApiURL('//my-orthanc-url:8042/'); // compatible with both http and https
 *     wvConfigProvider.setApiURL('/orthanc/'); // also works
 * 
 *     $locationProvider.html5Mode({
 *         enabled: true,
 *         requireBase: false
 *     });
 * })
 * ```
 **/
(function() {
    'use strict';

    var version = '0.5.1';

    angular
    .module('webviewer')
    .provider('wvConfig', function() {
        var urlConvertor = new osi.OrthancUrlConvertor(
            window.location.protocol,
            window.location.hostname,
            window.location.port,
            window.location.pathname);

        var _config = {
            version: {
                frontend: version,
                plugin: null,
                orthanc: null,
                db: null
            },
            orthancApiURL: null
        };

        this.setApiURL = function(orthancApiUrl) {
            _config.orthancApiURL = urlConvertor.toAbsoluteURL(orthancApiUrl);
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

                // Log versions and orthanc path
                console.log(_config);

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