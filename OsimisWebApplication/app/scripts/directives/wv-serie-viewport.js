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
      'wvImageIndex': '=?',
      'wvWidth': '=?',
      'wvHeight': '=?',
      'wvPlay': '=?',
      'wvOnSerieChanged': '&?',
      'wvOnInstanceChanged': '&?'
    },
    transclude: true,
    template: '<div><wv-image-viewport wv-image-id="imageId" wv-auto-resize="autoResize" wv-width="wvWidth" wv-height="wvHeight" wv-on-instance-changed="wvOnInstanceChanged({$id: $id})"><ng-transclude /></wv-image-viewport></div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      if (scope.wvImageIndex === null  || typeof scope.wvImageIndex === 'undefined') {
        scope.wvImageIndex = 0;
      }

      scope.imageId = null;
      scope.autoResize = false;

      var _unwatchWvImageIndex = null;
      
      var instances = [];
      
      scope.$watch('wvSerieId', function(wvSerieId, old) {
        if (wvSerieId == old) return;

        _unwatchWvImageIndex();
        scope.wvImageIndex = 0;
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
            ++scope.wvImageIndex;

            // reload at end
            if (scope.wvImageIndex >= instances.length - 1) {
              scope.wvImageIndex = 0;
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

            if (scope.wvImageIndex >= instances.length) {
              scope.wvImageIndex = instances.length - 1;
            }

            var tmpAutoResize = scope.autoResize;
            scope.autoResize = true; // auto resize the first image
            scope.imageId = instances[scope.wvImageIndex];
            $timeout(function() { // reset autoResize param
              scope.autoResize = tmpAutoResize;
              _onSerieChanged(volume);
            })
          }

          _unwatchWvImageIndex = scope.$watch('wvImageIndex', function(wvImageIndex, old) {
            if (wvImageIndex == old) return;

            // @todo refactor duplicate code but avoid recursive $watch call ! 
            if (wvImageIndex === null || typeof wvImageIndex === 'undefined') {
              wvImageIndex = 0;
            }
            else if (wvImageIndex >= instances.length) {
              wvImageIndex = instances.length - 1;
            }

            scope.imageId = instances[wvImageIndex];
          });
        });
      }
      
      function _onSerieChanged(volume) {
        scope.$data = volume;
        if (scope.wvOnSerieChanged) {
          scope.wvOnSerieChanged({ // @todo make sure REST API don't change
            //$data: {
              //ID: volume.ID,
              //Instances: volume.Instances,
              //IsStable: volume.IsStable,
              //LastUpdate: volume.LastUpdate,
              //MainDicomTags: volume.MainDicomTags,
              //ParentStudy: volume.ParentStudy,
              //Status: volume.status,
              //Type: volume.Type,
            //},
            $tags: volume.MainDicomTags
          });
        }
      }
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        scope.wvPlay = false;
        
        // @todo put some velocity
        // @todo calibrate the required speed and accuracy for the enduser
        scope.$apply(function() {
          if (deltaX > 0) {
            scope.wvImageIndex++;
            if (scope.wvImageIndex >= instances.length) {
              scope.wvImageIndex = instances.length - 1;
            }
          }
          else if (deltaX < 0) {
            scope.wvImageIndex--;
            if (scope.wvImageIndex < 0) {
              scope.wvImageIndex = 0;
            }
          }
        });

        event.preventDefault();
      });

    }
};
}]);
