/**
 * @ngdoc service
 *
 * @name webviewer.service:wvStudyManager
 *
 * @description
 * Manage study preloading.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvStudyManager', wvStudyManager);

    /* @ngInject */
    function wvStudyManager($rootScope) {
        var service = {
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvStudyManager
             * 
             * @name osimis.StudyManager#loadStudy
             *
             * @param {string} id
             * Id of the study.
             * 
             * @description
             * Load a study and preload its annotations and all its images
             * binaries. Be sure to call `#abortStudyLoading` when you change
             * the study.
             */
            loadStudy: loadStudy,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvStudyManager
             * 
             * @name osimis.StudyManager#abortStudyLoading
             *
             * @param {string} id
             * Id of the study.
             * 
             * @description
             * Stop preloading study images / instance tags / ...
             */
            abortStudyLoading: abortStudyLoading
        };

        ////////////////

        function loadStudy(id) {
            // Preload study images / instance tags / ...
            // @todo Call function instead of relying on event
            $rootScope.$emit('UserSelectedStudyId', id);
        }

        function abortStudyLoading(id) {
            // Stop preloading study images / instance tags / ...
            // @todo Call function instead of relying on event
            $rootScope.$emit('UserUnSelectedStudyId', id);
        }

        return service;
    }
})();