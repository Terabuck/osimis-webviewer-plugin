'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvStudylist
 * @description
 * # wvStudylist
 */
angular.module('webviewer')
  .directive('wvStudylist', function ($http, wvConfig) {
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
      ].join(''),
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.studies = [];
        
        $http
        .get(wvConfig.orthancApiURL + '/studies/')
        .then(function(response) {
            var studyIds = response.data;
            scope.studies = studyIds.map(function(studyId) {
                return {
                  label: '?',
                  value: {
                    id: studyId
                  }
                };
            });
          
        scope.studies.forEach(function(v) {
            $http
                .get(wvConfig.orthancApiURL + '/studies/'+v.value.id)
                .then(function(response) {
                    var study = response.data;
                    v.label = study.MainDicomTags.StudyDescription;
                });
             });
        });
      }
    };
  });
