/**
 * @ngdoc service
 *
 * @name webviewer.service:wvStudyManager
 *
 * @description
 * Manage study models.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvStudyManager', wvStudyManager);

    /* @ngInject */
    function wvStudyManager($rootScope, $q, wvConfig, wvAnnotationManager) {
        var service = {
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvStudyManager
             * 
             * @name osimis.StudyManager#getTags
             * 
             * @param {string} id
             * Id of the study
             * 
             * @return {Promise<object>}
             * The study tags promise
             * 
             * @description
             * Retrieve studies' tags
             *
             * @deprecated Not implemented
             */
            // getTags: getTags,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvStudyManager
             * 
             * @name osimis.StudyManager#loadStudy
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
             */
            abortStudyLoading: abortStudyLoading
        };

        ////////////////

        // function get(id) {
        //     var idHash = id.split(':');
        //     var orthancSeriesId = idHash[0];
        //     var subSeriesIndex = idHash[1] || 0;

        //     return service.listFromOrthancSeriesId(orthancSeriesId)
        //         .then(function(seriesList) {
        //             return seriesList[subSeriesIndex];
        //         });
        // }

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