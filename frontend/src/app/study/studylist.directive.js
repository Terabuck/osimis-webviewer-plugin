/**
 * @ngdoc directive
 * @name webviewer.directive:wvStudylist
 *
 * @restrict Element
 *
 * @param {Array<string>} wvPickableStudyIds
 * The list of available study ids.
 *
 * @param {boolean} [readonly=false]
 * Disable edition of the study picker data. Useful for technology such as
 * liveshare.
 */
(function() {
    'use strict';

    angular.module('webviewer')
    .directive('wvStudylist', function ($rootScope, wvConfig) {
        return {
            scope: {
                pickableStudyIds: '=wvPickableStudyIds',
                selectedStudyIds: '=?wvSelectedStudyIds',
                readonly: '=?wvReadonly'
            },
            template: [
                '<button type="button" class="btn btn-default wv-studylist" ',
                'ng-model="selectedStudyIds" placeholder="Study.." ',
                'ng-disabled="readonly" ',
                'bs-options="study.value as study.label for study in studies" ',
                'data-multiple="true" bs-select>',
                '</button>'
            ].join(''),
            restrict: 'E',
            link: function postLink(scope, element, attrs) {
                scope.studies = [];

                // Default values
                scope.pickableStudyIds = typeof scope.pickableStudyIds !== 'undefined' ? scope.pickableStudyIds : [];
                scope.selectedStudyIds = typeof scope.selectedStudyIds !== 'undefined' ? scope.selectedStudyIds : [];
                scope.readonly = typeof scope.readonly !== 'undefined' ? scope.readonly : false;

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
 