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
        var _namespaces = {};

        // listen method
        // arguments: [namespace], callback
    	function OsimisListener(arg1, arg2) {
            var callback = arg2 || arg1; // callback is the last argument
            var namespace = arg2 && arg1; // namespace is the first argument - only if there is two args

    		_listeners.push(callback);
            _namespaces[namespace] = _namespaces[namespace] || [];
            _namespaces[namespace].push(callback);
    	};

    	// listen once method
    	OsimisListener.once = function(callback) {
    	    OsimisListener('.<_^_>. ]MONDOSHAWANS[ .<_^_>.', function() {
    	        callback.apply(this, arguments);
    	        OsimisListener.close('.<_^_>. ]MONDOSHAWANS[ .<_^_>.');
    	    });
    	};

        // unlisten method
        OsimisListener.close = function(namespace) {
            if (!_namespaces.hasOwnProperty(namespace)) {
                return;
            }
            var namespaceListeners = _namespaces[namespace]

            window._.pullAll(_listeners, namespaceListeners);

            _namespaces[namespace] = {};
            delete _namespaces[namespace];
        }

        // trigger method
    	OsimisListener.trigger = function() {
    	    var args = Array.prototype.splice.call(arguments, 0);
    		_listeners.forEach(function(listener) {
    			listener.apply(null, args);
    		});
    	};

        // return listen method (= functor)
    	return OsimisListener;
    }

    root.Listener = OsimisListener;
})(window.osimis || (window.osimis = {}));