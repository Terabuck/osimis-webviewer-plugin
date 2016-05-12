/** WorkerPool
 * Usage:
 *  // in workerScript: just listen to message & post message back (only once) or throw..
 * To Test:
 *  - does throw in workerScript result in failed promise
 *  - can a new taskOptions be performed after an uncatched throw in a workerScript
 *  - is the post message be sure to not be called after a throw in a workerScript
 */
(function(module) {
    'use strict';

    /** new WorkerPool(options)
     *
     * 
     * @param options.path 
     * @param options.workerCount int
     * @param options.createPromiseFn function(wrappedFunction: (resolve, reject)=>Any): Promise
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
            var task = _this._tasksToProcess[0];
            var worker = _this._availableTaskWorkers[0];

            // Switch task from taskToProcess queue to taskInProcess queue
            _.pull(_this._tasksToProcess, task);
            _this._tasksInProcess.push(task);

            // Switch worker from available to busy queue
            _.pull(_this._availableTaskWorkers, worker);
            _this._busyTaskWorkers.push(worker);

            // Remove from taskInProcess once the task has been processed
            task.onSucceed.once(function() {
                _.pull(_this._tasksInProcess, task);
            });
            task.onFailure.once(function() {
                _.pull(_this._tasksInProcess, task);
            });

            // Assign task to the taskWorker
            worker.processTask(task);
        });
    };

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
            task.onSucceed.once(function(result) {
                resolve(result);
            });
            task.onFailure.once(function(reason) {
                reject(reason);
            });
            // task.onAbort ?
        });
    }

    module.WorkerPool = WorkerPool;

})(window.osimis || (window.osimis = {}));