'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbar
 * @description
 * # wvToolbar
 */
angular.module('webviewer')
  .directive('wvToolbar', function (_) {
    return {
      scope: {
        wvItems: '=',
        activeTool: '=?wvActiveTool'
      },
      templateUrl: 'app/toolbar/wv-toolbar.tpl.html',
      transclude: true,
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      },
      controller: ['$timeout', '$scope', function($timeout, $scope) {
        $scope.activeTool = $scope.activeTool || 'windowing';
        $scope.activeStates = {};
        $scope.splitpaneConfig = {x: 1, y: 1};

        $scope.$watch('activeTool', function(newTool, oldTool) {
          if ($scope.wvItems.hasOwnProperty(oldTool)) {
            $scope.wvItems[oldTool] = false;
          }
          
          $timeout(function() { // make sure activation comes after deactivation
            $scope.wvItems[newTool] = true;
          });
        });

        $scope.$watchCollection('activeStates', function(states) {
          _.forEach(states, function(value, state) {
            if (!$scope.wvItems.hasOwnProperty(state)) return;

            $scope.wvItems[state] = value;
          });
        });
        
        $scope.activeButton = null;
        /* jshint -W116*/
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
          overlay: true,
          flip: {
            horizontal: false,
            vertical: false
          },
          rotate: 0 // in degree
        };
        /* jshint +W116*/

        this.set = function(name) {
          var previousActive = $scope.activeButton;
          var newActive = name;

          /* jshint -W116*/
          if (previousActive == newActive) return;
          /* jshint +W116*/

          if (previousActive !== null) {
            $scope.$broadcast('toolbar.deactivated', previousActive);
          }

          $scope.activeButton = newActive;

          if (newActive !== null) {
            $timeout(function() {
              $scope.$broadcast('toolbar.activated', newActive);              
            });
          }
        };

        this.get = function() {
          return $scope.activeButton;
        };
      }]
    };
  });
