'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvViewportSerie
 * @description
 * # wvViewportSerie
 */
angular.module('osimiswebviewerApp')
.directive('wvViewportSerie', ['$q', '$timeout', '$interval', 'orthancApiService', function($q, $timeout, $interval, orthancApiService) {
return {
    scope: false,
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      // @todo auto resize
      // @todo auto windowing
      // @todo play command & stop on instance index update

      var _instanceIds = [];
      var _instanceIndex = 0;
      
      scope.$watch(attrs.wvViewportSerie, function(serieId, old) {
        if (!serieId) return; // @todo hide viewport ?

        var orderedInstancePromise = orthancApiService
          .serie.listInstances({id: serieId})
          .$promise;
        var serieInfoPromise = orthancApiService
          .serie.get({id: serieId})
          .$promise;

        $q.all({
          instances: orderedInstancePromise,
          volume: serieInfoPromise
        })
        .then(function(args) {
          var volume = args.volume; // @todo why volume ?
          var instances = args.instances;

          if (!instances || !instances.SlicesShort || instances.SlicesShort.length == 0) return;
          
          _instanceIndex = 0;
          _instanceIds = instances.SlicesShort.reverse().map(function(v) { return v[0]; });

          scope.$broadcast('viewport:SetInstance', {
            id: _instanceIds[_instanceIndex],
            adaptWindowing: true,
            adaptSize: true
          });
          
          // @note transmit data to overlay
          scope.$broadcast('serie:SerieChanged', volume.MainDicomTags, _instanceIds.length); // @todo rename serie:DataReceived
        });
      });
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        if (deltaX < 0 && deltaX < deltaY
         || deltaX > 0 && deltaX > deltaY
        ) {
          // @todo calibrate the required speed and accuracy for the enduser

          if (deltaX > 0) {
            _instanceIndex++;
          }
          else if (deltaX < 0) {
            _instanceIndex--;
          }

          if (_instanceIndex >= _instanceIds.length) {
            _instanceIndex = _instanceIds.length - 1;
          }
          else if (_instanceIndex < 0) {
            _instanceIndex = 0;
          }

          scope.$broadcast('viewport:SetInstance', {
            id: _instanceIds[_instanceIndex],
            adaptWindowing: false,
            adaptSize: false
          });
          scope.$apply();

          event.preventDefault();
        }
        else if (deltaX < 0 && deltaX > deltaY
              || deltaX > 0 && deltaX < deltaY
        ) {
          // @note allow normal scrolling of the window in vertical
        }
      });

    }
};
}]);
