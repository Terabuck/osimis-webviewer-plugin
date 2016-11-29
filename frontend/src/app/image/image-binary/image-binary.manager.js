/** wvImageBinaryManager
 *
 * Manage the binary loading side of images.
 *
 * As it is quite complex and requires specific caching & prefetching algorithm,
 * it is out of the standard image manager.
 *
 * Image loading shall only be aborted if it's
 * - in loading
 * - no longer in preloading criteria
 * - no longer displayed
 * so it can't ever happen with red within the same series..
 */
(function(osimis) {
    'use strict';

    function ImageBinaryManager(Promise, httpRequestHeaders, cornerstoneImageAdapter, cache, workerPool) {
        // Declare dependencies
        this._Promise = Promise;
        this._httpRequestHeaders = httpRequestHeaders; // may change dynamically, must keep reference
        this._cornerstoneImageAdapter = cornerstoneImageAdapter;
        this._workerPool = workerPool;
        this._cache = cache;

        // Declare observables
        this.onBinaryLoaded = new osimis.Listener();
        this.onBinaryUnLoaded = new osimis.Listener(); // @todo rename to Failed or aborted

        /** _loadedCachedRequests: boolean[imageId][quality]
         * Used to differentiate unfineshed cached request from fineshed cached requests.
         */
        this._loadedCacheIndex = {};

        // Flush cache every 5 seconds
        // @todo move inside cache module
        window.setInterval(function() {
            // @todo check once binary has been loaded + add debounce
            cache.flush();
        }, 5000);
    }
    
    // (id, quality, cornerstoneImageObject)
    ImageBinaryManager.prototype.onBinaryLoaded = function() { /* noop */ };

    // (id, quality)
    ImageBinaryManager.prototype.onBinaryUnLoaded = function() { /* noop */ };

    /**
     * Request the loading of an image with a specified priority.
     * Used notably by the preloader instead of the standard .get method.
     */
    ImageBinaryManager.prototype.requestLoading = function(id, quality, priority) {
        var Promise = this._Promise;
        var httpRequestHeaders = this._httpRequestHeaders;
        var cornerstoneImageAdapter = this._cornerstoneImageAdapter;
        var pool = this._workerPool;
        var cache = this._cache;
        var loadedCacheIndex = this._loadedCacheIndex;
        var _this = this;

        // Generate cache index
        // used to differentiate cached requests from finished cached requests
        loadedCacheIndex[id] = loadedCacheIndex[id] || {};

        // Generate request cache (if inexistant)
        var request = cache.get(id, quality);
        if (!request) {
            // Set http headers
            // @note Since the request is queued, headers configuration might changes in the meanwhile (before the request execution).
            //       However, since they are linked by reference (and not copied), changes will be bound.
            var headers = httpRequestHeaders; // used to set user auth tokens for instance

            // Download klv, extract metadata & decompress data to raw image
            var requestPromise = pool
                .queueTask({
                    type: 'getBinary',
                    id: id,
                    quality: quality,
                    headers: headers
                })
                .then(function(result) {
                    // Loading done

                    // Abort the finished loading when an abortion has been asked but not made in time
                    if (!cache.getRefCount(id, quality)) {
                        // Remove promise from cache
                        // @note Things will be cleaned by `.then(null, function(err))`
                        return Promise.reject(new Error('aborted'));
                    }

                    // configure cornerstone related object methods
                    var cornerstoneImageObject = cornerstoneImageAdapter.process(id, quality, result.cornerstoneMetaData, result.pixelBuffer, result.pixelBufferFormat);

                    // consider the promise to be resolved
                    loadedCacheIndex[id][quality] = true;
                    var request = cache.get(id, quality);
                    request.isLoaded = true;

                    // Set the cache size so total memory size can be limited
                    cache.setBinarySize(id, quality, result.pixelBuffer.byteLength);
                    // request.size = result.pixelBuffer.byteLength

                    // trigger binaryLoaded event
                    _this.onBinaryLoaded.trigger(id, quality, cornerstoneImageObject);

                    return cornerstoneImageObject;
                })
                .then(null, function(err) {
                    // Loading aborted

                    // This is called even when the error comes from the adapter (promise <.then(null, function(err) {...})> syntax)
                    // to be sure the promise is uncached anytime the promise is rejected

                    // Remove promise from cache in case of request failure. We need to check if it's in the cache
                    // though, since it's possible the item has already be removed in the abortLoading method. We
                    // keep things that way to avoid synchronization issues (see the abortLoading method source). 
                    if (cache.get(id, quality)) {
                        cache.remove(id, quality);
                    }
                    if (loadedCacheIndex[id] && typeof loadedCacheIndex[id][quality] !== 'undefined') {
                        delete loadedCacheIndex[id][quality];
                    }
                    
                    // Trigger binary has been unloaded (used by torrent-like loading bar)
                    _this.onBinaryUnLoaded.trigger(id, quality);

                    // Propagate promise error
                    return Promise.reject(err);
                });
            
            request = new osimis.ImageBinaryRequest(id, quality, requestPromise);
            cache.add(id, quality, request);
        }

        // Increment cache reference count
        cache.push(id, quality);
        request.pushPriority(priority);

        // Return Promise<cornerstoneImageObject>
        return request.promise;
    };

    ImageBinaryManager.prototype.abortLoading = function(id, quality, priority) {
        var pool = this._workerPool;
        var cache = this._cache;
        var loadedCacheIndex = this._loadedCacheIndex;
        
        var logError;
        if (console.warn) {
            logError = console.warn.bind(console);
        }
        else {
            logError = console.error.bind(console);
        }
        
        try {
            // Check the item is cached
            if (cache.getRefCount(id, quality) < 1) {
                throw new Error('Free uncached image binary.');
            }

            // Decount reference
            cache.pop(id, quality);
            try { // bypass errors till it's refactored & unit tested, this will have no consequence
                var request = cache.get(id, quality);
                request.popPriority(priority);
            }
            catch(e) {
                logError(e);
            }

            // Cancel request if pending
            if (cache.getRefCount(id, quality) === 0 && !loadedCacheIndex[id][quality]) {
                // Cancel request if pending
                pool
                    .abortTask({
                        type: 'getBinary',
                        id: id,
                        quality: quality
                    });

                // Request will be cleaned in the promise rejection, however, we need to remove
                // it right away to avoid sync issues (we don't want to way the 'ping-pong' delay induced
                // by the abortion with subsequent calls to the webworker.)
                // @warning may cause sync issue with taskPool
                cache.remove(id, quality);
                if (loadedCacheIndex[id] && typeof loadedCacheIndex[id][quality] !== 'undefined') {
                    delete loadedCacheIndex[id][quality];
                }
            }
        }
        catch (e) {
            logError('Failed removal of task');

            throw e;
        }
    };

    /** wvImageBinaryManager#get(id, quality)
     *
     * @param id <instanceId>:<frameIndex>
     * @param quality see osimis.quality
     * @return Promise<cornerstoneImageObject> // see https://github.com/chafey/cornerstone/wiki/image
     *
     */
    ImageBinaryManager.prototype.get = function(id, quality) {
        return this.requestLoading(id, quality, 0);
    };

    /** wvImageBinaryManager#free(id, quality)
     *
     * Free the defined image binary.
     * Reference counting implementation (if the image was called 4 times, #free has to be called 4 time as well to effectively free the memory).
     *
     * @pre The promise returned by wvImageBinary#get has been resolved (do not call free when the promise has been rejected !).
     * @pre The user has deleted his own pointers to the binary in order to allow the GC to clean the memory.
     *
     * @param id <instanceId>:<frameIndex>
     * @param quality see osimis.quality
     *
     */
    ImageBinaryManager.prototype.free = function(id, quality) {
        return this.abortLoading(id, quality, 0);
    };

    /** wvImageBinaryManager#listCachedBinaries(id)
     *
     * Return all the cached binaries of an image, listed
     * by their quality number.
     *
     * @param id <instanceId>:<frameIndex>
     * @return [] or [<quality-value: int>, ...]
     *
     */
    ImageBinaryManager.prototype.listCachedBinaries = function(id) {
        var loadedCacheIndex = this._loadedCacheIndex;
        var result = [];

        if (!loadedCacheIndex[id]) {
            result = [];
        }
        else {
            result = _
                .keys(loadedCacheIndex[id])
                .map(function(k) {
                    return +k; // Make sure keys stay integers
                });
        }

        return result;
    };

    /** wvImageBinaryManager#getCachedHighestQuality(id)
     *
     * @param id <instanceId>:<frameIndex>
     * @return quality: int
     *
     */
    ImageBinaryManager.prototype.getBestQualityInCache = function(id) {
        var loadedCacheIndex = this._loadedCacheIndex;
        if (!loadedCacheIndex[id]) {
            return null;
        }

        var highestQuality = _.max(_.keys(loadedCacheIndex[id]));

        return highestQuality;
    };

    osimis.ImageBinaryManager = ImageBinaryManager;

    // Inject module in angular
    angular
        .module('webviewer')
        .factory('wvImageBinaryManager', wvImageBinaryManager);

    /* @ngInject */
    function wvImageBinaryManager($q, wvConfig, wvCornerstoneImageAdapter) {
        // Init binary cache
        var cache = new osimis.ImageBinariesCache();

        // Init worker pool
        var workerPool = new window.osimis.WorkerPool({
            path: /* @inline-worker: */ '/app/image/image-parser.worker/main.js',
            workerCount: 6,
            createPromiseFn: $q,
            taskPriorityPolicy: new osimis.TaskPriorityPolicy(cache) // @todo break dependency w/ cache
        });
        // @todo Free inline-worker's ObjectUrl

        // Send the orthanc API URL to each threads
        workerPool.broadcastMessage({
            type: 'setOrthancUrl',
            orthancApiUrl: wvConfig.orthancApiURL
        });

        // Init binary manager
        return new osimis.ImageBinaryManager($q, wvConfig.httpRequestHeaders, wvCornerstoneImageAdapter, cache, workerPool);
    }

})(this.osimis || (this.osimis = {}));