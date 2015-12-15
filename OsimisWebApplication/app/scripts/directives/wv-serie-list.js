'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvSerieList
 * @description
 * # wvSerieList
 */
angular.module('osimiswebviewerApp')
.directive('wvSerieList', ['orthanc', function(orthanc) {
return {
  scope: {
    wvStudyId: '='
  },
  template: '\
    <ul style="padding: 0; list-style: none; height: 100%; overflow-y: auto;">\
      <li ng-repeat="id in serieIds" wv-viewport-size style="padding: 0">\
        <wv-serie-viewport wv-viewport-draggable wv-serie-id="id" wv-width="\'200\'" wv-height="\'200\'" wv-auto-resize="false">\
          <wv-overlay>\
            <div style="position: absolute; bottom:0; left:0; right:0; color: white; background-color: rgba(0,0,0,0.75);text-align: center;padding: 0.5em;">{{$instance.StudyDescription}}</div>\
          </wv-overlay>\
        </wv-serie-viewport>\
      </li>\
    </ul>\
  ',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    // @todo make sure there is enough space left for the overlay bar in html
    
    scope.$watch('wvStudyId', _setStudy);
    scope.serieIds = [];
    
    function _setStudy(wvStudyId, old) {
      orthanc
      .study.get({
        id: scope.wvStudyId
       })
      .$promise
      .then(function(study) {
        // @todo handle IsStable === false
        scope.serieIds = study.Series;
      });
    }

  }
};
}]);
