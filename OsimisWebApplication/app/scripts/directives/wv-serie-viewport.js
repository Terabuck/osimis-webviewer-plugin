'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvSerieViewport
 * @description
 * # wvSerieViewport
 */
angular.module('osimiswebviewerApp')
.directive('wvSerieViewport', ['$timeout', '$interval', 'orthanc', function($timeout, $interval, orthanc) {
return {
    scope: {
      'wvSerieId': '=',
      'wvInstanceIndex': '=?',
      'wvWidth': '=?',
      'wvHeight': '=?',
      'wvPlay': '=?'
    },
    transclude: true,
    template: '<div><wv-viewport wv-instance-id="instanceId" wv-auto-resize="autoResize" wv-width="wvWidth" wv-height="wvHeight"><ng-transclude/></wv-instance-viewport></div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      if (scope.wvInstanceIndex === null  || typeof scope.wvInstanceIndex === 'undefined') {
        scope.wvInstanceIndex = 0;
      }

      scope.instanceId = null;
      scope.autoResize = false;

      var _unwatchWvInstanceIndex = null;
      
      var instances = [];
      
      scope.$broadcast('evt', ['serie']);

      scope.$watch('wvSerieId', function(wvSerieId, old) {
        if (wvSerieId == old) return;

        _unwatchWvInstanceIndex();
        scope.wvInstanceIndex = 0;
        _setSerie(wvSerieId);
      });
      _setSerie(scope.wvSerieId);
      
      var playPromise = null;
      scope.$watch('wvPlay', function(play, old) {
        var speed = 1000/30;
        if (play == old) return;
        
        if (play == false && playPromise) {
          $interval.cancel(playPromise);
        }
        else if (play == true) {
          playPromise = $interval(function() {
            ++scope.wvInstanceIndex;

            // reload at end
            if (scope.wvInstanceIndex >= instances.length - 1) {
              scope.wvInstanceIndex = 0;
            }
          }, speed);
        }
      });

      function _setSerie(wvSerieId) {
        scope
        orthanc
        .serie.get({id: wvSerieId})
        .$promise
        .then(function(volume) {
          if (volume.Instances.length != 0) { // @todo why volume ?
            instances = volume.Instances;

            if (scope.wvInstanceIndex >= instances.length) {
              scope.wvInstanceIndex = instances.length - 1;
            }

            var tmpAutoResize = scope.autoResize;
            scope.autoResize = true; // auto resize the first image
            scope.instanceId = instances[scope.wvInstanceIndex];
            $timeout(function() { // reset autoResize param
              scope.autoResize = tmpAutoResize;
            });

            scope.$broadcast('serie-data', volume.MainDicomTags, volume.Instances.length);
          }
          
          // keep the index safe from overflow
          _unwatchWvInstanceIndex = scope.$watch('wvInstanceIndex', function(wvInstanceIndex, old) {
            if (wvInstanceIndex == old) return;

            // @todo refactor duplicate code but avoid recursive $watch call ! 
            if (wvInstanceIndex === null || typeof wvInstanceIndex === 'undefined') {
              wvInstanceIndex = 0;
            }
            else if (wvInstanceIndex >= instances.length) {
              wvInstanceIndex = instances.length - 1;
            }

            scope.instanceId = instances[wvInstanceIndex];
          });
        });
      }
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        scope.wvPlay = false;
        
        // @todo put some velocity
        // @todo calibrate the required speed and accuracy for the enduser
        scope.$apply(function() {
          if (deltaX > 0) {
            scope.wvInstanceIndex++;
            if (scope.wvInstanceIndex >= instances.length) {
              scope.wvInstanceIndex = instances.length - 1;
            }
          }
          else if (deltaX < 0) {
            scope.wvInstanceIndex--;
            if (scope.wvInstanceIndex < 0) {
              scope.wvInstanceIndex = 0;
            }
          }
        });

        event.preventDefault();
      });

    }
};
}]);
