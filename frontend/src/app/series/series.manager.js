/**
 * @ngdoc service
 *
 * @name webviewer.service:wvSeriesManager
 *
 * @description
 * Manage series models.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvSeriesManager', wvSeriesManager);

    /* @ngInject */
    function wvSeriesManager($rootScope, $q, wvConfig, wvAnnotationManager, wvOrthancSeriesAdapter, wvInstanceManager, wvPdfInstanceManager, wvVideoManager) {
        var service = {
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvSeriesManager
             * 
             * @name osimis.SeriesManager#get
             * 
             * @param {string} id
             * Id of the series in wv format, where multiframe instances are
             * considered as series.
             * 
             * * format: <orthancSeriesId>:<instanceNumber>
             * * instanceNumber can be > 0 if the series contain multiframe
             *   instances
             * 
             * @return {Promise<osimis.Series>}
             * The series model's promise.
             * 
             * @description
             * Retrieve a series from a frontend series id.
             */
            get: get,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvSeriesManager
             * 
             * @name osimis.SeriesManager#listFromOrthancSeriesId
             * 
             * @param {string} seriesId
             * Id of the series in wv format, where multiframe instances are
             * considered as series
             * 
             * * format: <orthancSeriesId>:<instanceNumber>
             * * instanceNumber can be > 0 if the series contain multiframe
             *   instances.
             *
             * @param {string} studyId
             * Id of the study in orthanc format. Only used to cache 
             * `PdfInstances` by studyId in the `PdfInstanceManager`.
             * 
             * @return {promise<array<WvSeries>>}
             * A list of series model (wrapped in promise).
             * 
             * @description
             * Retrieve a list of frontend series from a backend series id.
             */
            listFromOrthancSeriesId: listFromOrthancSeriesId,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvSeriesManager
             * 
             * @name osimis.SeriesManager#listFromOrthancStudyId
             * 
             * @param {string} studyId
             * Id of the study (in the orthanc format)
             * 
             * @return {promise<array<WvSeries>>}
             * A list of series model (wrapped in promise).
             * 
             * @description
             * Retrieve a list of frontend series from a backend study id.
             *
             * * @note There is no frontend study id
             */
            listFromOrthancStudyId: listFromOrthancStudyId,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvSeriesManager
             * 
             * @name osimis.SeriesManager#_cacheInstancesTags
             * 
             * @param {object} instancesTags
             * Hash of tags for each instances
             *
             * @description
             * Cache each instances' tags in `wvInstanceManager` from the
             * series request result.
             *
             * Done in the series manager for optimization: we do one single
             * HTTP request at the series level instead of multiple ones. 
             * Requested by a client to relieve his authentification proxy.
             */
            _cacheInstancesTags: _cacheInstancesTags,
            /**
             * @ngdoc method
             * @methodOf webviewer.service:wvSeriesManager
             * 
             * @name osimis.SeriesManager#_cachePdfInstance
             *
             * @param {string} studyId
             * Id of the study (in orthanc format) containing the PDF instance.
             *
             * @param {string} seriesId
             * Id of the series (in vw format) containing the PDF instance.
             *
             * @param {string} instanceId
             * Id of the instance (in orthanc format) containing the PDF.
             * 
             * @param {object} instancesTags
             * Hash of the instance's tags
             *
             * @description
             * Cache each pdf instances in `wvPdfInstanceManager` from the
             * series request result.
             *
             * Done in the series manager for optimization: we do one single
             * HTTP request at the series level instead of multiple ones. 
             * Requested by a client to relieve his authentification proxy.
             */
            _cachePdfInstance: _cachePdfInstance
        };

        ////////////////

        function get(id) {
            var idHash = id.split(':');
            var orthancSeriesId = idHash[0];
            var subSeriesIndex = idHash[1] || 0;

            return service.listFromOrthancSeriesId(orthancSeriesId)
                .then(function(seriesList) {
                    return seriesList[subSeriesIndex];
                });
        }

        function listFromOrthancSeriesId(seriesId) {
            // @todo bench this method
            var request = new osimis.HttpRequest();
            request.setHeaders(wvConfig.httpRequestHeaders);
            request.setCache(true);
            var seriesPromise = request.get(wvConfig.orthancApiURL + '/osimis-viewer/series/'+seriesId);

            return seriesPromise
                .then(function(response) {
                    // Cache instance tags in wvInstanceManager
                    var instancesTags = response.data.instancesTags;
                    _cacheInstancesTags(instancesTags);
                    
                    // Look up the study id to be able to retrieve all the
                    // annotations (only loadable at the study level) in case
                    // the series contains images. We also use the study id to
                    // bind the DICOM pdf instances to a specific study.
                    var request = new osimis.HttpRequest();
                    request.setHeaders(wvConfig.httpRequestHeaders);
                    request.setCache(true);
                    return $q.all({
                        instancesTags: $q.when(instancesTags),
                        data: $q.when(response.data),
                        studyId: request
                            .get(wvConfig.orthancApiURL + '/series/'+seriesId+'/study')
                            .then(function(studyInfo) {
                                var studyId = studyInfo.data.ID;
                                return studyId;
                            })
                    });
                })
                .then(function (response) {
                    var instancesTags = response.instancesTags;
                    var studyId = response.studyId;

                    var contentType = response.data.contentType;

                    // Return list of image series when series' content is
                    // images.
                    var seriesList = [];
                    if (contentType.indexOf('image') === 0) {
                        // @note One backend multiframe series is converted into 
                        // multiple front-end series, so the result is an array of
                        // series instead of a single one.
                        // @note PDF dicom instances/series will be ignored as they
                        // will be managed by the `PdfInstanceManager`.  They will
                        // be cached on this `/series` route response to diminish
                        // the HTTP request count though.
                        seriesList = wvOrthancSeriesAdapter.process(response.data);
                        
                        // Preload images annotations
                        wvAnnotationManager.loadStudyAnnotations(studyId);
                        
                        // Emit event when series have been loaded.
                        // This is notably used by image manager to cache available
                        // image qualities.
                        seriesList.forEach(function (series) {
                            $rootScope.$emit('SeriesHasBeenLoaded', series);
                        });
                    }
                    // Cache pdf instances from series' route HTTP request
                    // content & return empty list of image series.
                    else if (contentType.indexOf('pdf') === 0) {
                        // Cache pdf instances in the pdf instance manager
                        var pdfIds = _(instancesTags)
                            // Retrieve pdf-related instances
                            .pickBy(function(instanceTags) {
                                // Assert
                                if (instanceTags.MIMETypeOfEncapsulatedDocument !== 'application/pdf') {
                                    throw new Error('Series of pdf content type contains instances with non-pdf MimeType');
                                }

                                return instanceTags.MIMETypeOfEncapsulatedDocument === 'application/pdf';
                            })
                            // Cache the pdfs
                            .forEach(function(instanceTags, instanceId) {
                                _cachePdfInstance(studyId, seriesId, instanceId, instanceTags);
                            });
                    }
                    // Cache video instances from series' route HTTP request
                    // content & return empty list of image series.
                    else if (contentType.indexOf('video') === 0) {
                        // Cache pdf instances in the pdf instance manager
                        var videoIds = _(instancesTags)
                            .forEach(function(instanceTags, instanceId) {
                                _cacheVideoInstance(studyId, instanceId, instanceTags, contentType);
                            });
                    }
                    // Assert series' content type.
                    else {
                        throw new Error('Unsupported content type');
                    }

                    return seriesList;
                });
        }

        function listFromOrthancStudyId(studyId) {
            var request = new osimis.HttpRequest();
            request.setHeaders(wvConfig.httpRequestHeaders);
            request.setCache(true);
            return request.get(wvConfig.orthancApiURL + '/studies/'+studyId)
                .then(function(response) {
                    var orthancStudy = response.data;
                    var orthancSeriesIds = orthancStudy.Series;
                    var wvSeriesPromises = orthancSeriesIds.map(function(orthancSeriesId) {
                        return service.listFromOrthancSeriesId(orthancSeriesId);
                    });
                    
                    // Retrieve every wv-series' ids from orthanc-series ids.
                    // @note This does the same as $q.all, except it doesn't stop if one single promise fails.
                    return $q(function(resolve, reject) {
                        var wvSeriesLists = [];
                        var _failedResults = []; // @todo @warning forward failed promise somewhere! (the issue here is we must bypass failed request (for SR/bad DICOM tolerance)),
                                                 // so we must "resolve" failing promises, while we most reject them at the same times). Promise can't handle these use cases, either
                                                 // they fails or succeed but not both, they can't succeed partly.
                        var _loadedSeriesCount = 0;
                        wvSeriesPromises.forEach(function(wvSeriesPromise, i) {
                            wvSeriesPromise.then(function(wvSeries) {
                                // Don't use Array#push(), as this would change
                                // the series' display order due to asynchronicity
                                wvSeriesLists[i] = wvSeries; 

                                // We can't rely on i as last series can be
                                // loaded prior to any other one, thus making
                                // it resolve the promise before all the series
                                // have been loaded.
                                ++_loadedSeriesCount;

                                // Resolve overall promise once every sub
                                // promises have been processed
                                if (_loadedSeriesCount === wvSeriesPromises.length) {
                                    resolve(wvSeriesLists);
                                }
                            }, function(error) {
                                _failedResults.push(error);
                                console.error('Unable to retrieve a series.', error);
                                
                                // Incr loaded series count so we can resolve
                                // the promise, even if loading has failed
                                ++_loadedSeriesCount;

                                // Resolve overall promise once every sub
                                // promises have been processed
                                if(_loadedSeriesCount === wvSeriesPromises.length) {
                                    // Resolve the overall promise even if one
                                    // of the sub-promise fails.
                                    resolve(wvSeriesLists);
                                }
                            })
                        })
                    });
                })
                .then(function(wvSeriesList) {
                    // wvSeriesList is 2d array w/ [orthancSeriesIndex][wvSeriesIndex]
                    // we need to flatten it to only keep wvSeriesList
                    wvSeriesList = _.flatten(wvSeriesList);
                    return wvSeriesList;
                }, function(err) {
                    console.error(err);
                    return $q.reject(err); 
                });
        }

        function _cacheInstancesTags(instancesTags) {
            for (var instanceId in instancesTags) {
                if (instancesTags.hasOwnProperty(instanceId)) {
                    wvInstanceManager.setTags(instanceId, instancesTags[instanceId]);
                }
            }
        }

        function _cachePdfInstance(studyId, seriesId, instanceId, instanceTags) {
            wvPdfInstanceManager.setPdfInstance(instanceId, instanceTags, seriesId, studyId);
        }

        function _cacheVideoInstance(studyId, instanceId, instanceTags, contentType) {
            wvVideoManager.setVideoInstanceIdsForStudyId(studyId, instanceId, instanceTags, contentType);
        }

        return service;
    }
})();