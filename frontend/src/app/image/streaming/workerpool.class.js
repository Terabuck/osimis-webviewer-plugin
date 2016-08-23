/** WorkerPool
 * Usage:
 *  // in workerScript: just listen to message & post message back (only once) or throw..
 *  Worker listens to message evt.data.type (with specific type: 'abort')
 *  They respond {type: 'success', ...} or {type: 'failure', ...}
 *  
 * To Test:
 *  - does throw in workerScript result in failed promise
 *  - can a new taskOptions be performed after an uncatched throw in a workerScript
 *  - is the post message be sure to not be called after a throw in a workerScript
 */
(function(module) {
    'use strict';

    /**
     *
     * @class WorkerPool
     * 
     * @param options {object}
     *   `path` {string} - the path to the script of the worker.
     *      script may be inlined here using either Osimis' gulp-inline-worker script or URL Blob Workers.
     *   `workerCount` {number} - minimum 2 (one is always kept for high priority displays)
     *   `createPromiseFn` {function} - function(wrappedFunction: (resolve, reject)=>Any): Promise
     *   `taskPriorityPolicy` {function} - a configurable to set the priority of the task. see task-priority-policy.class.js for an example.
     * 
     * @description
     * The `WorkerPool` instantiate multiple TaskWorkers (~= threads),
     * the WorkerPool's user can either assign task to the pool or broadcast message to every TaskWorkers.
     * When a task is assigned to the pool, the WorkerPool waits for an available TaskWorker and assign the
     * task as soon as possible.
     *
     */
    function WorkerPool(options) {
        var _this = this;
        
        this._path = options.path;

        this._workerCount = options.workerCount || 1;

        if (!options.createPromiseFn) {
            throw new Error('createPromiseFn argument required');
        }
        else {
            this._createPromiseFn = options.createPromiseFn
        }

        /** _availableTaskWorkers
         *
         * @Queue
         *
         * Available Worker Thread Instances
         *
         */
        this._availableTaskWorkers = [];

        /** _availableTaskWorkers
         *
         * @Queue
         *
         * Busy Worker Thread Instances
         *
         */
        this._busyTaskWorkers = [];


        /** _tasksToProcess
         *
         * @PriorityQueue - Sorted by policy
         *
         */
        this._tasksToProcess = [];

        /** _tasksInProcess
         *
         * @Queue
         *
         */
        this._tasksInProcess = [];

        /** _taskPriorityPolicy: Object
         *
         * Used to determine which task is chosen
         *
         * @interface _taskPriorityPolicy
         *   #selectTask(availableWorkers, busyWorkers, tasksToProcess, tasksInProcess)
         *
         */
        this._taskPriorityPolicy = options.taskPriorityPolicy;

        // Initialize workers
        for (var i=0; i<this._workerCount; ++i) {
            // Create Worker - Put them in the available queue
            var taskWorker = new module.TaskWorker(this._path);
            this._availableTaskWorkers.push(taskWorker);

            // Use a closure to copy taskWorker reference at each iteration
            (function(taskWorker) {
                taskWorker.onAvailable(function() {
                    // Move worker from busy queue to available queue
                    _.pull(_this._busyTaskWorkers, taskWorker);
                    _this._availableTaskWorkers.push(taskWorker);

                    // Process a task
                    _this._processQueuedTaskInAvailableWorker();
                });
            })(taskWorker);
        }
    }

    /** WorkerPool#queueTask(taskOptions)
     *
     * @param taskOptions {type: <string>, ...}
     * @return Promise<TaskResult> once the taskOptions has finished (succeded, failed or aborted)
     *
     */
    WorkerPool.prototype.queueTask = function(taskOptions) {
        var _this = this;

        var task = new module.Task(taskOptions);

        this._tasksToProcess.push(task);

        this._processQueuedTaskInAvailableWorker();

        // Returne promise bound to task events
        return this._createPromiseFn(function(resolve, reject) {
            task.onSucceed(_this.queueTask, function(result) {
                // Close event listeners
                task.onFailure.close(_this.queueTask);
                task.onSucceed.close(_this.queueTask);
                // Resolve
                resolve(result);
            });
            task.onFailure(_this.queueTask, function(reason) {
                // Close event listeners
                task.onFailure.close(_this.queueTask);
                task.onSucceed.close(_this.queueTask);
                // Reject
                reject(reason);
            });
        });
    };

    /** WorkerPool#broadcast(message)
     * 
     * @method broadcast
     *
     * @param {object} message - any object sent as a message to every of the threads
     *
     * @description
     * Send a message to every existing threads, used mainly for configuration purpose
     *
     */
    WorkerPool.prototype.broadcastMessage = function(message) {
        var taskWorkers = _.concat(this._availableTaskWorkers, this._busyTaskWorkers);

        taskWorkers.forEach(function(worker) {
            worker.postMessage(message);
        });
    };

    /** WorkerPool#abortTask(taskOptions)
     *
     * Abort a task, note this method do nothing when task is inexistant.
     *
     * Compare the tasks in _tasksToProcess and remove them from the queue.
     * Compare the tasks in _tasksInProcess and abort them.
     *
     * @param taskOptions {type: <string>, ...}
     *
     */
    WorkerPool.prototype.abortTask = function(taskOptions) {
        // Remove task from the toProcess queue (if here)
        // @todo optimize (actually 50ms process) -> sorted by quality + tree research on id ?
        _.pullAllWith(this._tasksToProcess, [taskOptions], function(a, b) {
            return _.isEqual(a.options, b);
        });

        // Abort task from the inProcess queue
        for (var i=this._tasksInProcess.length-1; i>=0; --i) { // loop in reverse so we can remove items without breaking the loop iterations
            var task = this._tasksInProcess[i];
            if (_.isEqual(task.options, taskOptions)) {
                task.abort();
                _.pull(this._tasksInProcess, task);
            }
        }
    };

    /** WorkerPool#_processQueuedTaskInAvailableWorker()
     *
     * Called everytime a worker is available or a new task is added
     *
     */
    WorkerPool.prototype._processQueuedTaskInAvailableWorker = function() {
        var _this = this;

        // Make sure the task is processed after any event listeners are bound to the task
        window.setTimeout(function() {
            // Do nothing if there is no available worker or task to process
            if (_this._availableTaskWorkers.length === 0) {
                return;
            }
            if (_this._tasksToProcess.length === 0) {
                return;
            }

            // Retrieve both the first available task & worker
            var task = _this._taskPriorityPolicy.selectTask(
                _this._availableTaskWorkers,
                _this._busyTaskWorkers,
                _this._tasksToProcess,
                _this._tasksInProcess
            );

            // Cancel if no task has been chosen
            if (!task) {
                return;
            }

            var worker = _this._availableTaskWorkers[0];

            // Switch task from taskToProcess queue to taskInProcess queue
            _.pull(_this._tasksToProcess, task);
            _this._tasksInProcess.push(task);

            // Switch worker from available to busy queue
            _.pull(_this._availableTaskWorkers, worker);
            _this._busyTaskWorkers.push(worker);

            // Remove from taskInProcess once the task has been processed
            task.onSucceed(_this._processQueuedTaskInAvailableWorker, function() {
                task.onSucceed.close(_this._processQueuedTaskInAvailableWorker);
                task.onFailure.close(_this._processQueuedTaskInAvailableWorker);
                _.pull(_this._tasksInProcess, task);
            });
            task.onFailure(_this._processQueuedTaskInAvailableWorker, function() {
                task.onSucceed.close(_this._processQueuedTaskInAvailableWorker);
                task.onFailure.close(_this._processQueuedTaskInAvailableWorker);
                _.pull(_this._tasksInProcess, task);
            });

            // Assign task to the taskWorker
            worker.processTask(task);
        });
    };
    module.WorkerPool = WorkerPool;

})(window.osimis || (window.osimis = {}));