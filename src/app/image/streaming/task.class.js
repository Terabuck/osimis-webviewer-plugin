(function(module) {
    'use strict';

    /** new Task(options)
     *
     * @param options {type: <string>, ...}
     *
     */
    function Task(options) {
        this.type = options.type;

        // Options used to transmit the task to the worker
        this.options = options;

        // Called when task has been done
        this.onSucceed = new module.Listener();
        this.onFailure = new module.Listener();
    }

    module.Task = Task;
    
})(window.osimis || (window.osimis = {}));