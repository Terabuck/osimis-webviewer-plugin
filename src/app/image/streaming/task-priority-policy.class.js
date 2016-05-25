(function(module) {
    'use strict';

    function TaskPriorityPolicy(imageBinaryRequests) {
        // imageBinaryRequests[id][quality] = <ImageBinaryRequest> - used to calculate priorities
        this._imageBinaryRequests = imageBinaryRequests;
    }

    /** TaskPriorityPolicy#selectTask(availableWorkers, busyWorkers, tasksToProcess, tasksInProcess)
     *
     * @param availableWorkers
     * @param busyWorkers
     * @param tasksToProcess
     * @param tasksInProcess
     *
     * @return null or the chosen task to process
     *
     */
    TaskPriorityPolicy.prototype.selectTask = function(availableWorkers, busyWorkers, tasksToProcess, tasksInProcess) {
        var requestQueue = this._imageBinaryRequests;
        var taskQueue = tasksToProcess;

        // Sort by priority
        var loadingHighPriorityQueue = [];
        var preloadingHighPriorityQueue = [];
        var preloadingLowPriorityQueue = [];
    
        for (var i=0; i<taskQueue.length; ++i) {
            var task = taskQueue[i];
            var id = task.options.id;
            var quality = task.options.quality;
            var request = requestQueue[id][quality];
            var priority = request.getPriority();
            
            switch(priority) {
            case 0:
                loadingHighPriorityQueue.push({
                    request: request,
                    task: task
                });
                break;
            case 1:
                preloadingHighPriorityQueue.push({
                    request: request,
                    task: task
                });
                break;
            case 2:
                preloadingLowPriorityQueue.push({
                    request: request,
                    task: task
                });
                break;
            }
        }

        // see WvImageQualities
        // - 1 lowest
        // - 2 medium
        // - 100 lossless

        /** loading high priority **/

        // Process loading high priority first - lowest quality
        for (i=0; i<loadingHighPriorityQueue.length; ++i) {
            var task = loadingHighPriorityQueue[0].task;
            var request = loadingHighPriorityQueue[0].request;
            
            if (request.quality === 1) return task;
        }

        // Process loading high priority first - medium quality
        for (i=0; i<loadingHighPriorityQueue.length; ++i) {
            var task = loadingHighPriorityQueue[0].task;
            var request = loadingHighPriorityQueue[0].request;
            
            if (request.quality === 2) return task;
        }
   
        // Process loading high priority first - lossless quality
        for (i=0; i<loadingHighPriorityQueue.length; ++i) {
            var task = loadingHighPriorityQueue[0].task;
            var request = loadingHighPriorityQueue[0].request;
            
            if (request.quality === 100) return task;
        }

        // Make sure to always left over one thread for loading high priority
        if (availableWorkers.length < 2) return;

        /** preloading high priority **/

        // Process preloading high priority in second - lowest quality
        for (i=0; i<preloadingHighPriorityQueue.length; ++i) {
            var task = preloadingHighPriorityQueue[0].task;
            var request = preloadingHighPriorityQueue[0].request;
            
            if (request.quality === 1) return task;
        }

        // Process preloading high priority in second - medium quality
        for (i=0; i<preloadingHighPriorityQueue.length; ++i) {
            var task = preloadingHighPriorityQueue[0].task;
            var request = preloadingHighPriorityQueue[0].request;
            
            if (request.quality === 2) return task;
        }

        // Process preloading high priority in second - lossless quality
        for (i=0; i<preloadingHighPriorityQueue.length; ++i) {
            var task = preloadingHighPriorityQueue[0].task;
            var request = preloadingHighPriorityQueue[0].request;
            
            if (request.quality === 100) return task;
        }

        /** preloading low priority **/

        // Process preloading low priority in second - lowest quality
        for (i=0; i<preloadingLowPriorityQueue.length; ++i) {
            var task = preloadingLowPriorityQueue[0].task;
            var request = preloadingLowPriorityQueue[0].request;
            
            if (request.quality === 1) return task;
        }

        // Process preloading low priority in second - medium quality
        for (i=0; i<preloadingLowPriorityQueue.length; ++i) {
            var task = preloadingLowPriorityQueue[0].task;
            var request = preloadingLowPriorityQueue[0].request;
            
            if (request.quality === 2) return task;
        }

        // Process preloading low priority in second - lossless quality
        for (i=0; i<preloadingLowPriorityQueue.length; ++i) {
            var task = preloadingLowPriorityQueue[0].task;
            var request = preloadingLowPriorityQueue[0].request;
            
            if (request.quality === 100) return task;
        }


        return tasksToProcess[0] || null;
    };

    function _in(requestQueue, taskQueue) {
        // Sort by priority

        var taskInfo = taskQueue[0].options;
        var requestInfo = requestQueue[imageId][quality].options;
        console.log(requestQueue, taskQueue);
    }

    module.TaskPriorityPolicy = TaskPriorityPolicy;

})(window.osimis || (window.osimis = {}));