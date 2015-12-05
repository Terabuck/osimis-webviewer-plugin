'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbar
 * @description
 * # wvToolbar
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbar', function () {
    return {
      scope: {
        // wvModel: '='
      },
      template: '<div class="btn-toolbar" role="toolbar">\
                  <div class="btn-group" role="group">\
                    <ng-transclude/>\
                  </div>\
                 </div>',
      transclude: true,
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      },
      controller: function($scope) {
        // var self = this;
        // this.wvModel = $scope.wvModel;
        // $scope.$watch('wvModel', function(wvModel) {
        //   self.wvModel = wvModel;
        // });
      }
    };
  });
