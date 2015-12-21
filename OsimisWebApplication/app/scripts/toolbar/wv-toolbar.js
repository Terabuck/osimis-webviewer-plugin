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
        wvSettings: '=?opts'
      },
      templateUrl: 'scripts/toolbar/wv-toolbar.tpl.html',
      transclude: true,
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      },
      controller: ['$timeout', '$scope', function($timeout, $scope) {
        $scope.activeButton = null;
        if ($scope.opts == undefined) $scope.opts = {};

        this.set = function(name) {
          var previousActive = $scope.activeButton;
          var newActive = name;

          if (previousActive == newActive) return;

          if (previousActive !== null) {
            $scope.$broadcast('toolbar.deactivated', previousActive);
          }

          $scope.activeButton = newActive;

          if (newActive !== null) {
            $timeout(function() {
              $scope.$broadcast('toolbar.activated', newActive);              
            });
          }
        }

        this.get = function() {
          return $scope.activeButton;
        }
      }]
    };
  });
