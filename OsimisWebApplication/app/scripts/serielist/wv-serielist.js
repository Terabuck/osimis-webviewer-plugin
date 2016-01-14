'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvSerielist
 * @description
 * # wvSerielist
 */
angular.module('webviewer')
.directive('wvSerielist', ['orthancApiService', function(orthancApiService) {
return {
  scope: {
    wvStudy: '=',
    wvCssClassPrefix: '@?'
  },
  templateUrl: 'scripts/serielist/wv-serielist.tpl.html',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    // @todo make sure there is enough space left for the overlay bar in html
    
    scope.$watch('wvStudy', _setStudy);
    scope.serieIds = []; // @todo allow user defined specific set
    scope.wvCssClassPrefix = scope.wvCssClassPrefix || 'wv-serielist-';
    
    function _setStudy(wvStudy, old) {
      if (wvStudy == undefined) return; 
      
      orthancApiService
      .study.get({
        id: scope.wvStudy
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
