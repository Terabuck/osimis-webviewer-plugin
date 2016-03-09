(function(root) {
    'use strict';

    /** usage:
     *
     * object constructor:
     * 	this.onSomethingHappened = new osimis.Listener();
     * 	this.onSomethingHappened.trigger(arg1, arg2);
     *
     * user:
 	 *  object.onSomethingHappened(function(arg1, arg2) { 
 	 *      // react..
 	 *  });
     */
    function OsimisListener() {
    	var _listeners = [];

        // listen method
        // arguments: [namespace], callback
    	function OsimisListener(arg1, arg2) {
            var callback = arg2 || arg1; // callback is the last argument
            var namespace = arg2 && arg1; // namespace is the first argument - only if there is two args

    		if (namespace) {
    		    callback.namespace = namespace;
    		}
    		
    		_listeners.push(callback);
    	};

    	// listen once method
    	var _random = 0;
    	OsimisListener.once = function(callback) {
    	    var random = _random++;
    	    OsimisListener('.<_^_>. ]MONDOSHAWANS'+random+'[ .<_^_>.', function() {
    	        callback.apply(this, arguments);
    	        OsimisListener.close('.<_^_>. ]MONDOSHAWANS'+random+'[ .<_^_>.');
    	    });
    	};

        // unlisten method
        OsimisListener.close = function(namespace) {
            if (!namespace) {
                _listeners = []
            }
            else {
                _.remove(_listeners, function(listener) {
                    return listener.namespace && _compareNamespace(listener.namespace, namespace);
                });
            }

        }

        // dont trigger for namespace during the wrappedCodeCallback
        OsimisListener.ignore = function(namespace, wrappedCodeCallback) {
            _listeners.forEach(function(listener) {
                if (_compareNamespace(listener.namespace, namespace)) {
                    listener.ignore = true;
                }
            });
            
            wrappedCodeCallback();

            _listeners.forEach(function(listener) {
                if (_compareNamespace(listener.namespace, namespace)) {
                    listener.ignore = false;
                }
            });
        };

        // trigger method
    	OsimisListener.trigger = function() {
    	    var args = Array.prototype.splice.call(arguments, 0);
    	    
    		_listeners
    		    .filter(function(listener) {
    		        return !listener.ignore;
    		    })
                .forEach(function(listener) {
                    listener.apply(null, args);
                });
    	};

        // return listen method (= functor)
    	return OsimisListener;
    }
    
    function _compareNamespace(n1, n2) {
        if (!_.isArray(n1) || !_.isArray(n2)) {
            return n1 === n2;
        }
        else {
            // shallow comparison
            return _.isEqualWith(n1, n2, function(n1, n2) {
                return n1.length === n2.length && n1.reduce(function(result, value, idx) {
                    return result && value === n2[idx];
                }, true);
            });
        }
    }

    root.Listener = OsimisListener;
})(window.osimis || (window.osimis = {}));