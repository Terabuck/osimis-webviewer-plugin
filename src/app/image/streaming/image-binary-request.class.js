(function(module) {
    'use strict';

    /** ImageBinaryRequest
     * 
     * WorkerPool use it to determine which request should be prioritized.
     *
     * CacheFlushPolicy use it to determine the amount of global ram used and
     * which binary remove from cache first. 
     *
     */
    function ImageBinaryRequest(imageId, quality, promise) {
        this.imageId = imageId;
        this.quality = quality;
        this.promise = promise;

        /** isLoaded
         *
         * Used to differentiate fineshed cached requests from unfineshed cached request
         * Only the latter can be aborted
         *
         */
        this.isLoaded = false;

        /** size: undefined | Uint32
         *
         * Used by cache engine to determine the total amount of cache.
         * The cache can be then flushed when it becomes too big.
         * 
         * size === undefined when the binary has not been loaded yet
         *
         */
        this.size = undefined;

        /** requestOrigins: Array<RequestOrigin>
         *
         * requestOrigins.length === referenceCount
         *
         * RequestOrigins[<any>].source = 'prefetching' | 'display'
         *   The highest priority is set for CachedBinaries w/ requestOrigins[<any>].source === 'display'
         *
         * RequestOrigins[<any>].timestamp = Date.now()
         *   timestamp is used by WorkerPool to determine which binary load first when no other parameters are left.
         *   timestamp is used by CacheFlushPolicy to determine which binary should be freed first.
         *
         */
        this.requestOrigins = [];

        /** lastTimeDisplayed: undefined | timestamp
         *
         * Used by CacheFlushPolicy to determines which cache to flush first
         * 
         * _lastTimeDisplayed === undefined if the image is still displaying
         *
         */
        this._lastTimeDisplayed = undefined;
    }

    /** ImageBinaryRequest#getLastTimeDisplayed()
     *
     * Used by CacheFlushPolicy to determines which cache to flush first
     *
     */
    ImageBinaryRequest.prototype.getLastTimeDisplayed = function() {
        return this._lastTimeDisplayed || Date.now();
    }

    /** ImageBinaryRequest#getReferenceCount()
     *
     * Used to know if cache can be flushed.
     *
     */
    ImageBinaryRequest.prototype.getReferenceCount = function() {
        return this.requestOrigins.length;
    };

    /** ImageBinaryRequest#pushOrigin(source: 'prefetching' | 'display')
     *
     * Increment the reference count of the cached binary.
     *
     */
    ImageBinaryRequest.prototype.pushOrigin = function(source) {
        // Throw error if source argument is malformated
        if (['prefetching', 'display'].indexOf(source) === -1) {
            throw new Error('unknown source type');
        }

        // Instantiate RequestOrigin
        var RequestOrigin = {
            source: source,
            timestamp: Date.now()
        };

        // Add RequestOrigin to the queue
        this.requestOrigins.push(RequestOrigin);

        // unset _lastTimeDisplayed if the binary is being displayed at the moment
        if (source === 'display') {
            this._lastTimeDisplayed = undefined;
        }
    };

    ImageBinaryRequest.prototype.hasOrigin = function(source) {
        // Find the latest reference provided by the specified source
        for (var i=0; i<this.requestOrigins.length; ++i) {
            var requestOrigin = this.requestOrigins[i];
            if (requestOrigin.source === source) {
                // Return true - it has been found
                return true;
            }
        }

        // Return true - it has not been found
        return false;
    };

    /** ImageBinaryRequest#popOrigin(source: 'prefetching' | 'display')
     *
     * Decrement the reference count of the cached binary.
     * Used to know if a binary is no longer waiting for display or no longer required to be preloaded.
     *
     */
    ImageBinaryRequest.prototype.popOrigin = function(source) {
        var latestSourceIndex = null;

        // Find the latest reference provided by the specified source
        for (var i=this.requestOrigins.length-1; i>=0; ++i) {
            var requestOrigin = this.requestOrigins[i];
            if (requestOrigin.source === source) {
                // Save the first source found (in reverse loop order)
                latestSourceIndex = i;
                break;
            }
        }

        // Remove the latest reference provided by the specified source
        if (latestSourceIndex === null) {
            // No origin with source has been found - throw error
            throw new Error('Request origin source not found');
        }
        else {
            // Remove the request origin from the queue
            this.requestOrigins.splice(latestSourceIndex, 1);

            // If the source his no longer displayed, set the last time it's been to now
            if (source === 'display' && this.hasOrigin('display')) {
                this._lastTimeDisplayed = Date.now();
            }
        }
    };
    
    /** isWaitingForDisplay: boolean
     *
     * - true if the user is currently waiting for the image to be drawed..
     *
     * True provide the highest loading priority
     *
     */
    ImageBinaryRequest.prototype.isWaitingForDisplay = function() {
        // Return true if a request origin of display source has been found
        for (var i=this.requestOrigins.length-1; i>=0; ++i) {
            var requestOrigin = this.requestOrigins[i];
            if (requestOrigin.source === 'display') {
                return true;
            }
        }

        // Return false otherwise
        return false;
    };

    module.ImageBinaryRequest = ImageBinaryRequest;

})(window.osimis || (window.osimis = {}));
