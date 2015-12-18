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
  templateUrl: 'scripts/directives/wv-serie-list.tpl.html',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    // @todo make sure there is enough space left for the overlay bar in html
    
    scope.$watch('wvStudyId', _setStudy);
    scope.serieIds = []; // @todo allow user defined specific set
    
    function _setStudy(wvStudyId, old) {
      if (wvStudyId == undefined) return; 
      
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
