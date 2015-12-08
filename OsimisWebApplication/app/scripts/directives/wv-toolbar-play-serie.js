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
        var iconElement = element.children().children();
        
        scope.wvModel = !!scope.wvModel;
        if (!scope.wvModel) { // @todo refactor
          iconElement.addClass('fa-play');
        }
        else {
          iconElement.addClass('fa-pause');
        }

        scope.$watch('wvModel', function(wvModel, old) {
          if (wvModel == old) return;

          if (!wvModel) {
            iconElement.removeClass('fa-pause');
            iconElement.addClass('fa-play');
          }
          else {
            iconElement.removeClass('fa-play');
            iconElement.addClass('fa-pause');
          }
        });
      }
    };
  });
