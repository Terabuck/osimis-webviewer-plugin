'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbar
 * @description
 * # wvToolbar
 */
angular.module('webviewer')
  .directive('wvToolbar', function () {
    return {
      scope: {
        wvItems: '='
      },
      templateUrl: 'scripts/toolbar/wv-toolbar.tpl.html',
      transclude: true,
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      },
      controller: ['$timeout', '$scope', function($timeout, $scope) {
        $scope.activeTool = "windowing";
        $scope.activeStates = {};
        $scope.splitpaneConfig = {x: 1, y: 1};

        $scope.$watch("activeTool", function(newTool, oldTool) {
          if ($scope.wvItems.hasOwnProperty(oldTool)) {
            $scope.wvItems[oldTool] = false;
          }

          $scope.wvItems[newTool] = true;
        });

        $scope.$watchCollection("activeStates", function(states) {
          _.forEach(states, function(value, state) {
            if (!$scope.wvItems.hasOwnProperty(state)) return;

            $scope.wvItems[state] = value;
          });
        });
        
        $scope.activeButton = null;
        if ($scope.wvItems == undefined || !_.size($scope.wvItems)) $scope.wvItems = {
          windowing: true,
          zoom: false,
          pan: false,
          invert: false,
          lengthmeasure: false,
          anglemeasure: false,
          pixelprobe: false,
          ellipticalroi: false,
          rectangleroi: false,
          layout: {
            x: 1,
            y: 1
          },
          play: false,
          overlay: true
        };

        this.set = function(name) {
          var previousActive = $scope.activeButton;
          var newActive = name;

          if (previousActive == newActive) return;

          if (previousActive !== null) {
            $scope.$broadcast('toolbar.deactivated', previousActive);
          }

          $scope.activeButton = newActive;

          if (newActive !== null) {
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
