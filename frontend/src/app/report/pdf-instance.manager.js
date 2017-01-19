/**
 * @ngdoc service
 *
 * @name webviewer.service:wvPdfInstanceManager
 *
 * @description
 * The `wvPdfInstanceManager` provide information relative to image at the
 * instance level. These are mainly the DICOM tags. It is used by the image 
 * model, to retrieve tags. Most of the time, an image == a DICOM instance, but 
 * in case of multiframe instance, one image == one DICOM frame. Therefore,
 * `wvPdfInstanceManager` is useful to cache things at the instance level.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvPdfInstanceManager', wvPdfInstanceManager);

    /* @ngInject */
    function wvPdfInstanceManager($q, wvConfig) {
        var service = {
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvPdfInstanceManager
             * 
             * @name osimis.wvPdfInstanceManager#listFromOrthancStudyId
             * 
             * @param {string} id
             * Id of the study (in the orthanc format).
             * 
             * @return {Array<Promise<osimis.PdfInstance>>}
             * A list of pdf instance model (wrapped in promise).
             * 
             * @description
             * Retrieve a list of pdf instance model from a backend study id.
             *
             * * @warning Only call this method once the pdf instances have
             *   already been loaded by the `wvSeriesManager` in the 
             *   `/osimis-viewer/series` route. This is done to minimize HTTP
             *   request count (optimisation purpose).
             * 
             * * @note There is no frontend study id.
             */
            listFromOrthancStudyId: listFromOrthancStudyId, // @todo
            // get: get, // @todo
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvPdfInstanceManager
             *
             * @name osimis.wvPdfInstanceManager#getPdfBinary
             * 
             * @param {string} id
             * Id of the instance (orthanc format)
             * 
             * @return {Promise<@todo>}
             * The PDF document.
             * 
             * @description
             * Retrieve the PDF document for a specified instance.
             */
            getPdfBinary: getPdfBinary,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvPdfInstanceManager
             *
             * @name osimis.wvPdfInstanceManager#setPdfInstance
             * 
             * @param {string} instanceId
             * Id of the instance (in orthanc format) containing the PDF.
             * 
             * @param {object} instancesTags
             * Hash of the instance's tags
             * 
             * @param {string} seriesId
             * Id of the series (in vw format) containing the PDF instance.
             *
             * @param {string} studyId
             * Id of the study (in orthanc format) containing the PDF instance.
             * 
             * @description
             * Set a PdfInstance model.
             * 
             * Used mainly for optimization: retrieving all the pdf instances
             * tags at one single request within the `wvPdfInstanceManager` instead
             * of many requests for each instances.
             */
            setPdfInstance: setPdfInstance
        };

        /**
         * @type {object}
         * * keys: instance ids
         * * values: Array of pdf instance promises
         * * format: {<orthancStudyId>: Array<promiseOfPdfInstanceModel>, ...}
         *
         * @description
         * Cache pdf models by studyId when a series is loaded, because all
         * instances' tags are only retrieved in one single series http request
         * to avoid unnecessary http requests.
         * 
         * * @todo Flush the content
         */
        var _pdfInstancesByStudyId = {};

        /**
         * @type {object}
         * * keys: instance ids
         * * values: Pdf Instance promises
         * * format: {<orthancInstanceId>: <promiseOfPdfInstanceModel>, ...}
         *
         * @description
         * Cache pdf models by instanceId when a series is loaded, because all
         * instances' tags are only retrieved in one single series http request
         * to avoid unnecessary http requests.
         * 
         * * @todo Flush the content
         */
        var _pdfInstancesByInstanceId = {};

        /**
         * @type {object}
         * * keys: instance ids
         * * values: Pdf Document promises
         * * format: {<orthancInstanceId>: <@todo>, ...}
         *
         * @description
         * Cache pdf binaries by instanceId when they are downloaded for the 
         * first time.
         * 
         * * @todo Flush the content
         */
        var _pdfBinaryByInstanceId = {}

        return service;

        ////////////////

        // function get(id) {
        //     // Load image tags if not already in loading
        //     if (!_tagsByInstances.hasOwnProperty(id)) {
        //         var request = new osimis.HttpRequest();
        //         request.setHeaders(wvConfig.httpRequestHeaders);
        //         _tagsByInstances[id] = request
        //             .get(wvConfig.orthancApiURL + '/instances/'+id+'/simplified-tags')
        //             .then(function(response) {
        //                 var tags = response.data;

        //                 return tags;
        //             }, function(err) {
        //                 // @todo uncache & do something with the error
                        
        //                 return $q.reject(err);
        //             });
        //     }

        //     // Return the tags
        //     return _tagsByInstances[id];
        // }

        function listFromOrthancStudyId(studyId) {
            return _pdfInstancesByStudyId[studyId];
        }

        function getPdfBinary(id) {
            // Load pdf binary if not already in loading
            if (!_pdfBinaryByInstanceId.hasOwnProperty(id)) {
                var request = new osimis.HttpRequest();
                request.setHeaders(wvConfig.httpRequestHeaders);
                _pdfBinaryByInstanceId[id] = request
                    .get(wvConfig.orthancApiURL + '/instances/'+id+'/pdf')
                    .then(function(response) {
                        var pdfBinary = response.data;

                        return pdfBinary;
                    }, function(err) {
                        // @todo uncache & do something with the error
                        
                        return $q.reject(err);
                    });
            }

            // Return the binary
            return _pdfBinaryByInstanceId[id];
        }

        function setPdfInstance(instanceId, instanceTags, seriesId, studyId) {
            // Don't double cache instance.
            if (_pdfInstancesByInstanceId[instanceId]) {
                return;
            }

            // Create model based on the data.
            var pdfInstance = new osimis.PdfInstance(
                this,
                instanceId,
                instanceTags
            );

            // Always wrap models in a promise to stay consistant with the API.
            var pdfInstancePromise = $q.when(pdfInstance);

            // Reference the model based on its related studyId and instanceId.
            _pdfInstancesByStudyId[studyId] = _pdfInstancesByStudyId[studyId] || [];
            _pdfInstancesByStudyId[studyId].push(pdfInstancePromise);

            _pdfInstancesByInstanceId[instanceId] = pdfInstancePromise;
        }
    }
})();