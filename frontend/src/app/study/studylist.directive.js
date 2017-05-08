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
          scope.wvSelectedStudyIds = typeof scope.wvSelectedStudyIds !== 'undefined' ? scope.wvSelectedStudyIds : [];

          // @deprecated keep `wvSelectedStudyId` sync w/ `wvSelectedStudyIds`
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
 