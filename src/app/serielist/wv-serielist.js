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
    wvClassTmp: '=?wvClass'
  },
  templateUrl: 'scripts/serielist/wv-serielist.tpl.html',
  restrict: 'E',
  transclude: true,
  link: function postLink(scope, element, attrs) {
    // @todo make sure there is enough space left for the overlay bar in html
    
    _setDefaultCssClasses();

    scope.$watch('wvStudy.id', _setStudy);
    scope.serieIds = []; // @todo allow user defined specific set

    function _setStudy(id, old) {
      if (!id) return; 
      
      orthancApiService
      .study.get({
        id: id
       })
      .$promise
      .then(function(study) {
        // @todo handle IsStable === false
        scope.serieIds = study.Series;
      });
    }

    function _setDefaultCssClasses() {
      scope.wvClass = scope.wvClassTmp || {};

      var cssClasses = {
        ul: scope.wvClass.ul || 'wv-serielist',
        li: scope.wvClass.li || 'wv-serielist-item',
        overlay: scope.wvClass.ul || 'wv-serielist-overlay'
      };
      
      scope.wvClass = cssClasses;
    }
  }
};
}]);
