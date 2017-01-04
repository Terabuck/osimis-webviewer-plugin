/**
 * @ngdoc directive
 * @name webviewer.directive:wvStudylist
 *
 * @restrict Element
 */
(function() {
  'use strict';

  angular.module('webviewer')
    .directive('wvStudylist', function ($rootScope, wvConfig) {
      return {
        scope: {
          wvSelectedStudyId: '='
        },
        template: [
          '<button type="button" class="btn btn-default wv-studylist" ',
          'ng-model="wvSelectedStudyId" placeholder="Study.." ',
          'bs-options="study.value as study.label for study in studies"',
          ' bs-select>',
          '</button>'
        ].join(''),
        restrict: 'E',
        link: function postLink(scope, element, attrs) {
          scope.studies = [];
          
          var request = new osimis.HttpRequest();
          request.setHeaders(wvConfig.httpRequestHeaders);
          request.setCache(true);

          request
          .get(wvConfig.orthancApiURL + '/studies/')
          .then(function(response) {
              var studyIds = response.data;
              scope.studies = studyIds.map(function(studyId) {
                  return {
                    label: '?',
                    value: studyId
                  };
              });
            
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
