/**
 * @ngdoc service
 *
 * @name wvConfig
 *
 * @description
 * The `wvConfig` provider is used:
 *   * To retrieve/configure the Orthanc's path.
 *   * To retrieve the web-viewer version.
 *   * To retrieve frontend configuration (defined from backend config files).
 *   * To configure user authentication (see the httpRequestHeaders method documentation below).
 *
 * Warning: Web Viewer is uncompatible with <base> HTML element (due to SVG/XLink issue)! Don't use it!
 *
 * @example
 * The following example show how to use the `wvConfig` provider to set the Orthanc's path.
 *
 * ```js
 * angular.module('new-module', ['webviewer'])
 * .config(function($locationProvider, wvConfigProvider) {
 *     wvConfigProvider.setApiURL('http://my-orthanc-url:8042/');
 *     wvConfigProvider.setApiURL('//my-orthanc-url:8042/'); // compatible with both http and https
 *     wvConfigProvider.setApiURL('/orthanc/'); // also works
 *
 *     // See setHttpRequestHeaders method example for user authentication
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

    var version = '0.5.3';

    /**
     * @class
     * 
     * @name Configuration
     *
     * @description
     * The `Configuration` class handle the general webviewer config,
     * and versioning informations. This is much like a private local POJO-like
     * class.
     * 
     * It is meant only to be used by the `wvConfig` service. However, that service
     * gives a public access to an unique _instance_ of this class.
     */
    function Configuration() {
        this.version = {
            frontend: version,
            plugin: null,
            orthanc: null,
            db: null
        };

        // Frontend config retrieved from server.
        // Intended to enabled/disable/configure frontend features from
        // serverside orthanc configuration file.
        this.frontend = {};

        this.browser = {};
        this.orthancApiURL = null;
        this.httpRequestHeaders = {};
    };

    /**
     * @ngdoc method
     * 
     * @name wvConfig.setHttpRequestHeaders
     * @methodOf webviewer.wvConfig
     * @description
     * WebViewer is not responsible for authentication. However, it is quite often embedded behind a proxy.
     * It's therefore convenient to provide the additional user informations to the proxy. The `wvConfig.setHttpRequestHeaders`
     * method can be used to set an user token.
     *
     * The host application has to keep the token up to date. The web viewer doesn't handle refresh. If the token expires while
     * the web viewer is being used, the end user will have to reload the page.
     *
     * `setHttpRequestHeaders` has to be called by the host at module initialization (unless configuration routes are on public
     * access) and each time the token expires (see example in the setHttpRequestHeaders method's documentation).
     *
     * @note Would be better to propose a policy. However, we can't pass policies to web workers, so this solution is not
     * technically achievable.
     * 
     * @param {object} headers A hash containing the HTTP headers we wan't to insert in each request
     * 
     * @example
     * The following example show how to use the `wvConfig` provider to set an user token.
     *
     * ```js
     * angular.module('new-module', ['webviewer'])
     * .config(function($locationProvider, wvConfigProvider) {
     *     // This is called at module initialization time; therefore, userToken has to exist prior to application initialization.
     *     // The above statement is invalided if the following configuration routes are available without the user token:
     *     // - '${ORTHANC_URL}/plugins/osimis-web-viewer'
     *     // - '${ORTHANC_URL}/system'
     *     var userToken = 'some-user-token';
     *
     *     // Configure the header
     *     wvConfigProvider.setHttpRequestHeaders({
     *         'my-auth-header': userToken
     *     });
     * })
     * .run(function(wvConfig) {
     *     // This is called at run time (can be called from anywhere in AngularJS host app). It should be called again
     *     // each time the token is invalidated (preferably before, but will not be required once we have a "retry request"
     *     // mechanism).
     *     var newUserToken = 'renewed-user-token';
     *     
     *     wvConfig.setHttpRequestHeaders({
     *         'my-auth-header': newUserToken
     *     });
     * });
     * ```
     */
    Configuration.prototype.setHttpRequestHeaders = function(headers) {
        // @note We make sure not to change the _config.httpRequestHeaders reference

        // Clean header
        for (var prop in this.httpRequestHeaders) {
            if (this.httpRequestHeaders.hasOwnProperty(prop)) {
                delete this.httpRequestHeaders[prop];
            }
        }

        // Copy header
        _.assign(this.httpRequestHeaders, headers);
    };

    angular
    .module('webviewer')
    .provider('wvConfig', function() {
        // @todo use angular.injector for scoped config?
        
        var _config = new Configuration();

        // Make sure the httpRequestHeaders configuration option is available before module initialization so we can use it to
        // verify webviewer frontend/backend version compatibility at start.
        // The option is also available after initialization in case the headers have to be changed for instance because of an
        // expired token.
        // We don't have to set this if the following routes are on public access
        // - /plugins/osimis-web-viewer
        // - /system
        // - /osimis-viewer/config
        this.setHttpRequestHeaders = _config.setHttpRequestHeaders.bind(_config);

        var urlConvertor = new osi.OrthancUrlConvertor(
            window.location.protocol,
            window.location.hostname,
            window.location.port,
            window.location.pathname);

        this.setApiURL = function(orthancApiUrl) {
            _config.orthancApiURL = urlConvertor.toAbsoluteURL(orthancApiUrl);
        };

        this.$get = function(WvHttpRequest, $q, uaParser) {
            // This is executed at runtime (after initialization)
            
            // Add browser to config (for log mainly)
            _config.browser = uaParser.getResult();
            
            // Check version compatibility between the frontend and the plugin
            var request1 = new WvHttpRequest();
            request1.setHeaders(_config.httpRequestHeaders);
            var pluginInfo = request1.get(_config.orthancApiURL + '/plugins/osimis-web-viewer');
            var request2 = new WvHttpRequest();
            request2.setHeaders(_config.httpRequestHeaders);
            var orthancInfo = request2.get(_config.orthancApiURL + '/system');

            // Retrieve frontend config from server
            var serverConfig = request1.get(_config.orthancApiURL + '/osimis-viewer/config');

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