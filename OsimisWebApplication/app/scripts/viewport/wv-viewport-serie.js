'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewportSerie
 * @description
 * # wvViewportSerie
 */
angular.module('webviewer')
.directive('wvViewportSerie', ['$parse', '$q', '$timeout', '$interval', 'orthancApiService', function($parse, $q, $timeout, $interval, orthancApiService) {
return {
    scope: false,
    restrict: 'A',
    require: 'wvViewportSerie',
    controller: function() {

    },
    link: function postLink(scope, element, attrs, ctrl) {
      var elementScope = angular.element(element).isolateScope(); // @todo require ctrl instead
      
      // @todo auto resize
      // @todo auto windowing
      // @todo play command & stop on instance index update

      var _instanceIds = [];
      var _instanceIndex = 0;
      
      var GetSerieId; // method taking a scope as the param
      var SetSerieId;
      if (!attrs.wvViewportSerie) {
        var _isolatedSerieId = $parse(attrs.wvViewportSerie)(scope);
        GetSerieId = function(scope) { return _isolatedSerieId; };
        SetSerieId = function(scope, val) { _isolatedSerieId = val; };
      }
      else {
        GetSerieId = $parse(attrs.wvViewportSerie);
        SetSerieId = GetSerieId.assign;
      }

      ctrl.setSerie = function(args) {
        var id = args.id;
        SetSerieId(scope, id);
      };

      scope.$on('serie:SetSerie', function(evt, args) {
        ctrl.setSerie(args);
      });
      scope.$on('serie:ShowNextInstance', function(evt, args) {
        var restartWhenSerieEnd = args.restartWhenSerieEnd;
        _showNextInstance(restartWhenSerieEnd);
      });

      scope.$watch(GetSerieId, function(serieId, old) {
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

          var firstLoad = !_instanceIds || _instanceIds.length === 0;
          
          _instanceIndex = 0;
          _instanceIds = instances.SlicesShort.reverse().map(function(v) { return v[0]; });

          elementScope.$broadcast('viewport:SetInstance', {
            id: _instanceIds[_instanceIndex],
            adaptWindowing: true,
            adaptSize: true
          });
          
          // @note transmit data to overlay
          if (firstLoad) scope.$emit('serie:SerieLoaded');
          elementScope.$broadcast('serie:SerieChanged', volume.MainDicomTags, _instanceIds.length); // @todo rename serie:DataReceived
        });
      });
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        if (deltaX < 0 && deltaX < deltaY
         || deltaX > 0 && deltaX > deltaY
        ) {
          // @todo calibrate the required speed and accuracy for the enduser

          if (deltaX > 0) {
            _showNextInstance(false);
            scope.$apply();
          }
          else if (deltaX < 0) {
            _showPreviousInstance();
            scope.$apply();
          }

          event.preventDefault();
        }
        else if (deltaX < 0 && deltaX > deltaY
              || deltaX > 0 && deltaX < deltaY
        ) {
          // @note allow normal scrolling of the window in vertical
        }
      });

      function _showNextInstance(restartWhenSerieEnd) {
        _instanceIndex++;

        if (_instanceIndex >= _instanceIds.length) {
          _instanceIndex = restartWhenSerieEnd ? 0 : _instanceIds.length - 1;
        }

        elementScope.$broadcast('viewport:SetInstance', {
          id: _instanceIds[_instanceIndex],
          adaptWindowing: false,
          adaptSize: false
        });
      }

      function _showPreviousInstance() {
        _instanceIndex--;

        if (_instanceIndex < 0) {
          _instanceIndex = 0;
        }

        elementScope.$broadcast('viewport:SetInstance', {
          id: _instanceIds[_instanceIndex],
          adaptWindowing: false,
          adaptSize: false
        });
      }

    }
};
}]);
