/** WorkerPool
 * Usage:
 *  WorkerPool.createPromise = $q; // set the promise function
 *  var p = new WorkerPool(workerScriptPath, workerCount);
 *  p.postMessage(params)
 *  // in workerScript: just listen to message & post message back (only once) or throw..
 * To Test:
 *  - does throw in workerScript result in failed promise
 *  - can a new task be performed after an uncatched throw in a workerScript
 *  - is the post message be sure to not be called after a throw in a workerScript
 */
(function(module) {
    'use strict';

    function TaskQueueWorker(script) {
        var _this = this;

        this._workerThread = new Worker(script);
        this._taskQueue = [];

        this._isWorking = false;
        this._onTaskQueueFinished = new window.osimis.Listener();
        this._onFinishedValid = new window.osimis.Listener();
        this._onFinishedError = new window.osimis.Listener();

        this._workerThread.addEventListener('message', function(evt) {
          _this._onFinishedValid.trigger(evt.data);
        }, false);

        this._workerThread.addEventListener('error', function(evt) {
          _this._onFinishedError.trigger(evt.data);
        }, false);
    }
    TaskQueueWorker.prototype.isAvailable = function() {
        return this._taskQueue.length === 0;
    }
    TaskQueueWorker.prototype.postMessage = function(message, onValidCallback, onErrorCallback) {
        var _this = this;

        // create task
        var task = function() {
            _this._onFinishedValid.once(function(result) {
                // send result
                onValidCallback(result);

                // call next task
                _this._isWorking = false;
                _this._doNextTask();
            });

            _this._onFinishedError.once(function(error) {
                console.log('TaskQueueWorker said [error]: ', error);
                // send error
                onErrorCallback(error);

                // call next task
                _this._isWorking = false;
                _this._doNextTask();
            });

            _this._isWorking = true;
            _this._workerThread.postMessage(message);
        }

        // add task to the queue
        this._taskQueue.push(task);

        // process the task directly if the thread is available
        if (!this._isWorking) {
            this._doNextTask();
        }
    }
    TaskQueueWorker.prototype._doNextTask = function() {
        if (this._taskQueue.length === 0) {
            // no next task - do nothing
            return;
        }
        else if (this._isWorking) {
            throw new Error("worker is already working");
        }

        var task = this._taskQueue.shift();
        task();
    }

    function WorkerPool(script, workerCount) {
        this.workers = [];
        for (var i=0; i<workerCount; ++i) {
            var worker = new TaskQueueWorker(script);
            this.workers.push(worker);
        }

        this._nextAvailableWorker = 0;
    }
    // returns a promise with result/error
    WorkerPool.prototype.postMessage = function(message) {
        var _this = this;

        return WorkerPool.createPromise(function (resolve, reject) {
            var worker = _this.workers[_this._nextAvailableWorker];

            // send new message / add a new task & gather result
            worker.postMessage(message, resolve, reject);

            // naive implementation that round workers, if tasks take more time on one worker while the other are left available,
            // it doesn't know it.
            // all the queue logic should go to pool...
            _this._nextAvailableWorker = _this._nextAvailableWorker + 1 < _this.workers.length ? _this._nextAvailableWorker + 1 : 0;
        });
    }

    WorkerPool.createPromise = null;

    module.WorkerPool = WorkerPool;

})(window.osimis || (window.osimis = {}));