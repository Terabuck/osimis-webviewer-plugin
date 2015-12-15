'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvSerieViewport
 * @description
 * # wvSerieViewport
 */
angular.module('osimiswebviewerApp')
.directive('wvSerieViewport', ['$q', '$timeout', '$interval', 'orthanc', function($q, $timeout, $interval, orthanc) {
return {
    scope: {
      'wvSerieId': '=',
      'wvInstanceIndex': '=?',
      'wvWidth': '=?',
      'wvHeight': '=?'
    },
    transclude: true,
    templateUrl: 'scripts/directives/wv-serie-viewport.tpl.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      if (scope.wvInstanceIndex === null  || typeof scope.wvInstanceIndex === 'undefined') {
        scope.wvInstanceIndex = 0;
      }

      scope.instanceId = null;
      scope.autoResize = false;
      scope.autoWindowing = false;

      var _unwatchWvInstanceIndex = null;
      
      var instances = [];
      
      scope.$broadcast('evt', ['serie']);

      scope.$watch('wvSerieId', function(wvSerieId, old) {
        if (wvSerieId == old) return;

        if (_unwatchWvInstanceIndex) {
          _unwatchWvInstanceIndex();
        }
        scope.wvInstanceIndex = 0;
        _setSerie(wvSerieId);
      });
      _setSerie(scope.wvSerieId);
      
      var _playPromise = null;
      scope.$on('play-command', function(evt, strategy) {
        var speed = 100; // @todo adapt speed depending on the instance size & distance
        var activate = strategy.execute();
        if (activate == false && _playPromise) {
          $interval.cancel(_playPromise);
        }
        else if (activate == true) {
          _playPromise = $interval(function() {
            ++scope.wvInstanceIndex;

            // reload at end
            if (scope.wvInstanceIndex >= instances.length - 1) {
              scope.wvInstanceIndex = 0;
            }
          }, speed);
        }
      });

      function _setSerie(wvSerieId) {
        if (wvSerieId == undefined) return;

        $q.all({
        instances: orthanc
          .serie.listInstances({id: wvSerieId})
          .$promise,
        volume: orthanc
          .serie.get({id: wvSerieId})
          .$promise
        })
        .then(function(args) {
          var volume = args.volume; // @todo why volume ?
          if (args.instances.SlicesShort.length != 0) {
            instances = args.instances.SlicesShort.reverse().map(function(v) { return v[0]; });

            if (scope.wvInstanceIndex >= instances.length) {
              scope.wvInstanceIndex = instances.length - 1;
            }

            var tmpAutoResize = scope.autoResize;
            var tmpAutoWindowing = scope.autoWindowing;
            scope.autoResize = true; // auto resize the first image
            scope.autoWindowing = true; // auto window the first image
            scope.instanceId = instances[scope.wvInstanceIndex];
            $timeout(function() { // reset autoResize param
              scope.autoResize = tmpAutoResize;
              scope.autoWindowing = tmpAutoWindowing;
            });

            scope.$broadcast('serie-data', volume.MainDicomTags, instances.length);
          }
          
          // keep the index safe from overflow
          _unwatchWvInstanceIndex = scope.$watch('wvInstanceIndex', function(wvInstanceIndex, old) {
            if (wvInstanceIndex == old) return;

            // @todo refactor duplicate code but avoid recursive $watch call ! 
            if (wvInstanceIndex === null || typeof wvInstanceIndex === 'undefined' || wvInstanceIndex < 0) {
              scope.wvInstanceIndex = 0;
            }
            else if (wvInstanceIndex >= instances.length) {
              scope.wvInstanceIndex = instances.length - 1;
            }
            else {
              scope.instanceId = instances[wvInstanceIndex];
            }
          });
        });
      }
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        if (_playPromise) {
          $interval.cancel(_playPromise);
          _playPromise = null;
        }
        
        if (deltaX < 0 && deltaX < deltaY
         || deltaX > 0 && deltaX > deltaY
        ) {
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
        }
        else if (deltaX < 0 && deltaX > deltaY
              || deltaX > 0 && deltaX < deltaY
        ) {
          //event.preventDefault();
        }
      });

    }
};
}]);
