'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvStudylist
 * @description
 * # wvStudylist
 */
angular.module('webviewer')
  .directive('wvStudylist', ['orthancApiService', function (orthancApiService) {
    return {
      scope: {
        wvSelectedStudy: '='
      },
      template: [
        '<button type="button" class="btn btn-default wv-studylist" ',
        'ng-model="wvSelectedStudy" placeholder="Study.." ',
        'bs-options="study.value as study.label for study in studies"',
        ' bs-select>',
        '</button>'
      ].join(),
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.studies = [];

        orthancApiService
        .study.query()
        .$promise
        .then(function(studies) {
          scope.studies = studies.map(function(studyId) {
            return {
              label: '?',
              value: {
                id: studyId
              }
            };
          });
          
          scope.studies.forEach(function(v) {
            orthancApiService
            .study.get({id: v.value.id})
            .$promise
            .then(function(study) {
              v.label = study.MainDicomTags.StudyDescription;
            });
          });
        });
      }
    };
  }]);
