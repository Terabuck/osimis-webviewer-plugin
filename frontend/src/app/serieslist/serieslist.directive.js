'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvSeriesManagerlist
 * @description
 * # wvSeriesManagerlist
 */
angular.module('webviewer')
.directive('wvSerieslist', ['wvSeriesManager', function(wvSeriesManager) {
return {
  scope: {
    wvStudyId: '=',
    wvClassTmp: '=?wvClass',
    wvOnStudyLoaded: '&?wvOnStudyLoaded' // For testing convenience
  },
  templateUrl: 'app/serieslist/serieslist.directive.html',
  restrict: 'E',
  transclude: true,
  link: function postLink(scope, element, attrs) {
    // @todo make sure there is enough space left for the overlay bar in html
    
    scope.$watchCollection('wvClassTmp', function() {
      _setDefaultCssClasses();
    });

    scope.$watch('wvStudyId', _setStudy);
    scope.seriesIds = []; // @todo allow user defined specific set

    function _setStudy(id, old) {
      if (!id) return; 
      // @todo handle IsStable === false

      wvSeriesManager
        .listFromOrthancStudyId(id)
        .then(function(seriesList) {
          scope.seriesIds = seriesList.map(function(series) {
            return series.id;
          });

          // Trigger on-study-loaded (mainly for testing convenience)
          if (scope.wvOnStudyLoaded) {
            scope.wvOnStudyLoaded();
          }
        });
      
    }

    function _setDefaultCssClasses() {
      scope.wvClass = scope.wvClassTmp || {};

      var cssClasses = {
        ul: scope.wvClass.ul || 'wv-serieslist',
        li: scope.wvClass.li || 'wv-serieslist-item',
        overlay: scope.wvClass.ul || 'wv-serieslist-overlay'
      };
      
      scope.wvClass = cssClasses;
    }
  }
};
}]);
