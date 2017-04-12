/**
 * @ngdoc directive
 * @name webviewer.directive:wvStudylist
 *
 * @restrict Element
 *
 * @param {Array<string>} wvPickableStudyIds
 * The list of available study ids.
 */
(function() {
    'use strict';

    angular.module('webviewer')
    .directive('wvStudylist', function ($rootScope, wvConfig) {
        return {
            scope: {
                pickableStudyIds: '=wvPickableStudyIds',
                wvSelectedStudyId: '=?wvSelectedStudyId', // @deprecated
                wvSelectedStudyIds: '=?wvSelectedStudyIds'
            },
            template: [
                '<button type="button" class="btn btn-default wv-studylist" ',
                'ng-model="wvSelectedStudyIds" placeholder="Study.." ',
                'bs-options="study.value as study.label for study in studies" ',
                'data-multiple="true" bs-select>',
                '</button>'
            ].join(''),
            restrict: 'E',
            link: function postLink(scope, element, attrs) {
                scope.studies = [];

                // Default values
                scope.pickableStudyIds = typeof scope.pickableStudyIds !== 'undefined' ? scope.pickableStudyIds : [];
                scope.wvSelectedStudyIds = typeof scope.wvSelectedStudyIds !== 'undefined' ? scope.wvSelectedStudyIds : [];

                // @deprecated keep `wvSelectedStudyId` sync w/
                // `wvSelectedStudyIds`.
                if (scope.wvSelectedStudyId) {
                    scope.wvSelectedStudyIds[0] = scope.wvSelectedStudyId;
                }
                Object.defineProperty(scope, 'wvSelectedStudyId', {
                    get: function() {
                        return scope.wvSelectedStudyIds[0];
                    },
                    set: function(val) {
                        scope.wvSelectedStudyIds[0] = val;
                    },
                    enumerable: true
                });
                // /@deprecated

                // Update shown studies' information based on pickable study
                // ids.
                scope.$watchCollection('pickableStudyIds', function(studyIds) {
                    scope.studies = studyIds.map(function(studyId) {
                        return {
                            label: '?',
                            value: studyId
                        };
                    });

                    // Load study label.
                    // @todo Move this inside a study model
                    scope.studies.forEach(function(v) {
                        var studyId = v.value;

                        var request = new osimis.HttpRequest();
                        request.setHeaders(wvConfig.httpRequestHeaders);
                        request.setCache(true);

                        request
                            .get(wvConfig.orthancApiURL + '/studies/' + studyId)
                            .then(function(response) {
                                var study = response.data;
                                v.label = study.MainDicomTags.StudyDescription;
                            });
                    });
                });
            }
        };
    });
})();
 