'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvToolbarPlaySerie
 * @description
 * # wvToolbarPlaySerie
 */
angular.module('osimiswebviewerApp')
  .directive('wvToolbarPlaySerie', function () {
    return {
      scope: {
      	wvModel: '='
      },
      require: '^wvToolbar',
      template: '<button type="button" class="btn btn-sm btn-default" ng-click="wvModel = !wvModel"><span class="fa"></span></button>',
      restrict: 'E',
      link: function postLink(scope, element, attrs, toolbarCtrl) {
        scope.wvModel = !!scope.wvModel;
        if (!scope.wvModel) { // @todo refactor
          element.children().children().addClass('fa-play');
        }
        else {
          element.children().children().addClass('fa-pause');
        }

        scope.$watch('wvModel', function(wvModel, old) {
          if (wvModel == old) return;

          if (wvModel) {
            element.children().children().removeClass('fa-pause');
            element.children().children().addClass('fa-play');
          }
          else {
            element.children().children().removeClass('fa-play');
            element.children().children().addClass('fa-pause');
          }
        });
      }
    };
  });
