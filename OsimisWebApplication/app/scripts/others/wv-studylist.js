'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvStudylist
 * @description
 * # wvStudylist
 */
angular.module('osimiswebviewerApp')
  .directive('wvStudylist', ['orthancApiService', function (orthancApiService) {
    return {
      scope: {
        wvSelectedStudy: '='
      },
      template: '<button type="button" class="btn btn-default" ng-model="wvSelectedStudy" placeholder="Study.." bs-options="study.value as study.label for study in studies" bs-select></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.studies = [];

        orthancApiService
        .study.query()
        .$promise
        .then(function(studies) {
          scope.studies = studies.map(function(v) {
            return {
              label: '?',
              value: v
            };
          });
          
          scope.studies.forEach(function(v) {
            orthancApiService
            .study.get({id: v.value})
            .$promise
            .then(function(study) {
              v.label = study.MainDicomTags.StudyDescription;
            });
          });
        });
      }
    };
  }]);
