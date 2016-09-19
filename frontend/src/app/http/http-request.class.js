/**
 * @ngdoc overview
 * 
 * @name HttpRequest
 * 
 * @description
 * Wrapper over the xhr object. 
 * Its user need to set `HttpRequest.Promise` variable before usage.
 *
 * @rationale
 * We need a concrete way to handle http requests and set additional headers both from AngularJS and the web workers.
 * This class has been developed because most xhr wrappers don't provide control over xhr.responseType, or aren't fit
 * for usage within web workers (due to call to the window object).
 * 
 * We also intent to extend this later to support asynchronous header injection (which may implies a specific communication
 * funel between workers and the main thread).
 *
 * @example
 * See unit tests for examples.
 */
(function(module) {

    /**
     * Super cache object at global scope.
     *
     * Keys are the URL of the request.
     * Values are Promises of the request result. 
     * 
     * Cache is disabled by default.
     * 
     * @type {Object}
     */
    var _cache = {};

    /**
     * @class
     */
    function HttpRequest() {
        this._httpHeaders = {};

        this._xhr = new XMLHttpRequest();
        
        // Use JSON by default - can be overriden via headers
        this._httpHeaders['Content-type'] = 'application/json';
        this._xhr.responseType = 'json';

        // Disable cache by default
        this._cacheEnabled = false;

        // Check against dual send of a request (_send should only be called once with this implementation
        // due to the actual usage of xhr callback)
        this._hasBeenSent = false;
    }

    /**
     * Can be overriden by user. We recommand to use $q for AngularJS and to keep native promises for workers.
     * Be careful the implementation is Promise/A+ compliant, see my comment here
     * https://github.com/chrisdavies/plite/issues/4#issuecomment-247022165.
     *
     * @todo change native promise by some lib if we need IE compatibility http://caniuse.com/#search=promise
     * 
     * @type {function}
     * @static
     */
    HttpRequest.Promise = (Promise && function(resolver) {
        // Wrap native promises
        return new Promise(resolver);
    }) || undefined;


    /**
     * @description
     * Activate/Deactivate global cache for the actual request.
     * 
     * The result's promise is cached, not the result itself (to avoid dual requests for instance).
     * Failed requests invalidate the cache.
     *
     * @warning `setCache` should only be used for GET requests.
     * 
     * Note: the cache is based on exact URL matching, therefore, a trailing slash request may not
     * use the same cache as a non-trailing slash request, even if the same resource is sent.
     *
     * @method HttpRequest.setCache
     * @access public
     * 
     * @param {boolean} enableCache Activate/Deactivate the global cache for this request
     */
    HttpRequest.prototype.setCache = function(enableCache) {
        this._cacheEnabled = !!enableCache;
    };

    /**
     * @description
     * Used mainly to add user credentials.
     *
     * @method HttpRequest.setHeaders
     * @access public
     * 
     * @param {object} headers HTTP headers hashmap
     */
    HttpRequest.prototype.setHeaders = function(headers) {
        // Clone the header object (make sure we never change the passed object, especially since it's very likely it's
        // a direct reference to the main configuration object).
        // Use JSON instead of lodash to lower dependency in workers.
        headers = JSON.parse(JSON.stringify(headers));

        // Store the headers for conveniance until they are added to xhr object (which must
        // be 'opened' first)
        this._httpHeaders = headers;

        // Set back default 'Content-type' if not present
        this._httpHeaders['Content-type'] = headers.hasOwnProperty('Content-type') ? headers['Content-type'] : 'application/json';
    };

    /**
     * @description
     * Used to retrieve binary data. See XMLHTTPRequest.responseType.
     * This method doesn't have to be used when retrieving JSON data (this is the default).
     *
     * @method HttpRequest.setResponseType
     * @access public
     * 
     * @param {string} responseType Equivalent to XMLHTTPRequest.responseType.
     *    * 'arraybuffer'
     *    * 'json'
     *    * ...
     */
    HttpRequest.prototype.setResponseType = function(responseType) {
        this._xhr.responseType = responseType;
    };

    /**
     * @description
     * Send an HTTP GET request to _url_.
     * 
     * @method HttpRequest.get
     * @access public
     * 
     * @param {url} url The destination of the HTTP request
     *
     * @return {Promise} The result of the request
     */
    HttpRequest.prototype.get = function(url) {
        return this._send('GET', url);
    };

    /**
     * @description
     * Send an HTTP POST request to _url_.
     * 
     * @method HttpRequest.post
     * @access public
     * 
     * @param {url} url The destination of the HTTP request
     * @param {object} data Input data sent via the POST method
     *
     * @return {Promise} The result of the request
     */
    // @note Commented untill we really need it. Need additional unit test once uncomment.
    // HttpRequest.prototype.post = function(url, data) {
    //     return this._send('POST', url, data);
    // };

    /**
     * @description
     * Send an HTTP PUT request to _url_.
     * 
     * @method HttpRequest.put
     * @access public
     * 
     * @param {url} url The destination of the HTTP request
     * @param {object} data Input data sent via the POST method
     *
     * @return {Promise} The result of the request
     */
    // @note Commented untill we really need it. Need additional unit test once uncomment.
    // HttpRequest.prototype.put = function(url, data) {
    //     return this._send('PUT', url, data);
    // };

    /**
     * @description
     * Send an HTTP DELETE request to _url_.
     * 
     * @method HttpRequest.delete
     * @access public
     * 
     * @param {url} url The destination of the HTTP request
     *
     * @return {Promise} The result of the request
     */
    // @note Commented untill we really need it. Need additional unit test once uncomment.
    // HttpRequest.prototype.delete = function(url) {
    //     return this._send('DELETE', url);
    // };

    /**
     * @description
     * Send an HTTP request to _url_.
     * 
     * @method HttpRequest._send
     * @access private
     *
     * @param {string} method The HTTP method type of the call (eg. GET, ...)
     * @param {url} url The destination of the HTTP request
     * @param {object} data (optional) Additional input data sent via the request (ie. for POST method)
     *
     * @return {Promise} The result of the request
     */
    HttpRequest.prototype._send = function(method, url, inputData) {
        var Promise = HttpRequest.Promise;
        var xhr = this._xhr;
        var cacheEnabled = this._cacheEnabled;
        var headers = this._httpHeaders;

        // Check against dual send of a request (_send should only be called once with this implementation
        // due to the actual usage of xhr callback).
        if (this._hasBeenSent) {
            throw new Error('HttpRequest should only be sent once');
        }

        // Serialize inputData
        if (inputData && headers.hasOwnProperty('Content-type')) {
            inputData = JSON.stringify(inputData);
        }

        // Set request method, url and async mode
        xhr.open(method, encodeURI(url), true); // true: async xhr request because we wan't to be able to abort the request

        // Inject the headers in the xhr object (now that the xhr object has been opened)
        for (var prop in headers) {
            if (headers.hasOwnProperty(prop)) {
                xhr.setRequestHeader(prop, headers[prop]);
            }
        }

        if (cacheEnabled && _cache[url]) {
            // Return the cached version if available & cache is enabled
            return _cache[url];
        }
        else {
            // Wrap response in promise
            var requestPromise = Promise(function(resolve, reject) {
                // Set callback on request success/failure
                xhr.onreadystatechange = function() {
                    // Only check finished requests
                    if (xhr.readyState !== XMLHttpRequest.DONE) {
                        return;
                    }
                    else {
                        // Remove listener once triggered, should have no effect since the DONE state should only happen once
                        xhr.onreadystatechange = null;
                    }

                    // Retrieve response data
                    var data = typeof xhr.response !== 'undefined' ? xhr.response : xhr.responseType === 'json' && JSON.parse(xhr.responseText);

                    if (xhr.status === 200) {
                        // Resolve the xhr result with the same scheme as AngularJS#$http
                        // @note requests with status 30x are automatically redirected by the browser
                        resolve({
                            data: data,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: xhr.getResponseHeader.bind(xhr)
                        });
                    }
                    else {
                        // Invalidate cache
                        if (cacheEnabled && _cache[url]) {
                            // Don't delete cache entry (time consuming), only mark property as undefined
                            _cache[url] = undefined;
                        }

                        // Reject the xhr result with the same scheme as AngularJS#$http
                        reject({
                            data: data,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: xhr.getResponseHeader.bind(xhr)
                        });
                    }
                };

            });

            // Cache request
            if (cacheEnabled) {
                _cache[url] = requestPromise;
            }

            // Trigger request (asyncronously)
            xhr.send(inputData);
            
            // Prevent additional requests
            this._hasBeenSent = true;

            return requestPromise;
        }
    };

    /**
     * @description
     * Cancel the sent XHR request.
     * Must be used after #get/#post/#put/#delete/...
     * 
     * @method HttpRequest.abort
     * @access public
     */
    HttpRequest.prototype.abort = function() {
        // Check the request has been sent
        if (!this._hasBeenSent) {
            throw new Error('HttpRequest can only abort sent requests');
        }

        // Abort the http request
        this._xhr.abort();
    }

    module.HttpRequest = HttpRequest;

})(typeof WorkerGlobalScope !== 'undefined' ?
    (self.osimis || (self.osimis = {})) // use osimis module on workers
    : (window.osimis || (window.osimis = {})) // use osimis module on main thread
);