'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvMultiViewport
 * @description
 * # wvMultiViewport
 */
angular.module('osimiswebviewerApp')
.directive('wvMultiViewport', function () {
return {
  scope: {
    wvLayout: '=?'
  },
  template: '\
    <div class="container-fluid" style="height: 100%; padding: 0;">\
        <div class="row" ng-style="{height: rowHeight}" style="padding: 0; margin: 0;" ng-repeat="viewportRow in viewports track by $index">\
            <div ng-class="cellClasses" wv-viewport-size style="height: 100%; padding: 0;" ng-repeat="viewport in viewportRow track by $index">\
                <wv-serie-viewport wv-viewport-droppable wv-viewport-mouse-events wv-width="\'parent\'" wv-height="\'parent\'" wv-serie-id="viewport.serieId" wv-instance-index="viewport.instanceIndex">\
                    <wv-overlay></wv-overlay>\
                </wv-serie-viewport>\
            </div>\
        </div>\
    </div>\
  ',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    if (scope.wvLayout == undefined) {
      scope.wvLayout = {
        x: 1,
        y: 1
      }
    }

    scope.rowHeight = 100 / scope.wvLayout.y + '%';
    scope.cellClasses = ['col-sm-' + 12/scope.wvLayout.x];
    
    scope.viewports = []; // [[{serieId: …, instanceIndex: …, orientation: …}]];
    scope.$watch('wvLayout', function(wvLayout, old) {
      for (var i=0; i<wvLayout.y; ++i) {
        if (!scope.viewports[i]) scope.viewports[i] = [];

        for (var j=0; j<wvLayout.x; ++j) {
          if (!scope.viewports[i][j]) {
            scope.viewports[i][j] = {
              serieId: undefined,
              instanceIndex: 0
            };
          }
        }
        
        scope.viewports[i] = scope.viewports[i].slice(0, wvLayout.x);
        $(window).resize(); // @todo use angular events instead
      }
      scope.viewports = scope.viewports.slice(0, wvLayout.y);

      scope.rowHeight = 100 / wvLayout.y + '%';
      scope.cellClasses = ['col-sm-' + 12/wvLayout.x];
    }, true);
  }
};
});
