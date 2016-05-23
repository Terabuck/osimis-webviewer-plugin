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
        return tasksToProcess[0];
    };

    module.TaskPriorityPolicy = TaskPriorityPolicy;

})(window.osimis || (window.osimis = {}));