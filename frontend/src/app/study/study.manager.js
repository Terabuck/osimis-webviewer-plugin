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
    function wvStudyManager($rootScope, wvConfig) {
        var service = {
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvStudyManager
             * 
             * @name osimis.StudyManager#getAllStudyIds
             *
             * @return {Promise<Array<string>>}
             * The list of the study ids.
             * 
             * @description
             * Retrieve the list of all available study ids from Orthanc. This
             * basically return the content of the `<orthanc>/studies` route.
             */
            getAllStudyIds: getAllStudyIds,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvStudyManager
             * 
             * @name osimis.StudyManager#getPatientStudyIds
             *
             * @param {string} id
             * The Orthanc id of the patient.
             *
             * @return {Promise<Array<string>>}
             * The list of the study ids.
             *
             * @description
             * Retrieve the list of all study ids related to one single
             * patient.
             */
            getPatientStudyIds: getPatientStudyIds,
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

        function getAllStudyIds() {
            var request = new osimis.HttpRequest();
            request.setHeaders(wvConfig.httpRequestHeaders);
            request.setCache(true);

            return request
                .get(wvConfig.orthancApiURL + '/studies/')
                .then(function(response) {
                    return response.data;
                });
        }

        function getPatientStudyIds(id) {
            var request = new osimis.HttpRequest();
            request.setHeaders(wvConfig.httpRequestHeaders);
            request.setCache(true);

            return request
                .get(wvConfig.orthancApiURL + '/patients/' + id)
                .then(function(response) {
                    return response.data.Studies;
                });
        }

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