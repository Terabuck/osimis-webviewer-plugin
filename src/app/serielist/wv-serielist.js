'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvSerielist
 * @description
 * # wvSerielist
 */
angular.module('webviewer')
.directive('wvSerielist', ['wvSerie', function(wvSerie) {
return {
  scope: {
    wvStudy: '=',
    wvClassTmp: '=?wvClass'
  },
  templateUrl: 'app/serielist/wv-serielist.tpl.html',
  restrict: 'E',
  transclude: true,
  link: function postLink(scope, element, attrs) {
    // @todo make sure there is enough space left for the overlay bar in html
    
    scope.$watchCollection('wvClassTmp', function() {
      _setDefaultCssClasses();
    });

    scope.$watch('wvStudy.id', _setStudy);
    scope.serieIds = []; // @todo allow user defined specific set

    function _setStudy(id, old) {
      if (!id) return; 
      // @todo handle IsStable === false

      wvSerie
        .listFromOrthancStudyId(id)
        .then(function(series) {
          scope.serieIds = series.map(function(serie) {
            return serie.id;
          });
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
