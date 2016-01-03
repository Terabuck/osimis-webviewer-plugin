'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewportSerie
 * @description
 * # wvViewportSerie
 */
angular.module('webviewer')
.directive('wvViewportSerie', ['$timeout', '$parse', '$q', 'orthancApiService', function($timeout, $parse, $q, orthancApiService) {
return {
    scope: false,
    restrict: 'A',
    require: 'wvViewportSerie',
    controller: function() {

    },
    link: function postLink(scope, element, attrs, ctrl) {
      var elementScope = angular.element(element).isolateScope(); // @todo require ctrl instead
      
      var _instanceIds = [];
      var _instanceIndex = 0;
      var _tags = null;
      var _instanceCount = null;
      
      var GetSerieId; // method taking a scope as the param
      var SetSerieId;
      if (!attrs.wvViewportSerie) {
        var _isolatedSerieId = $parse(attrs.wvViewportSerie)(scope);
        GetSerieId = function(scope) { return _isolatedSerieId; };
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

      scope.$on('serie:GetSerieData', function(evt, fn) {
        fn(_tags, _instanceCount);
      });
      scope.$on('serie:SetSerie', function(evt, args) {
        ctrl.setSerie(args);
      });
      scope.$on('serie:ShowNextInstance', function(evt, args) {
        var restartWhenSerieEnd = args.restartWhenSerieEnd;
        _showNextInstance(restartWhenSerieEnd);
      });

      var nextTimeout = null;
      scope.$on('serie:Play', function(evt, args) {
        // @note very approximative algorithm to automaticaly set speed
        var mmPerSeconds = 25;
        function processNextIteration() {
          elementScope.$broadcast('viewport:GetInstanceData', function(tags) {
            if (!tags) return;
            
            var size = +tags.SliceThickness + (+tags.SpacingBetweenSlices || 0); // @todo calculate SpacingBetweenSlices using positions and orientation...
            var fps = mmPerSeconds / size;
            var speed_ms = Math.round(1000 / fps);

            nextTimeout = $timeout(function() {
              _showNextInstance(true);
              scope.$evalAsync(processNextIteration);
            }, speed_ms);
          });
        }
        processNextIteration();
      });
      scope.$on('serie:Pause', function(evt, args) {
        if (nextTimeout) {
          $timeout.cancel(nextTimeout);
          nextTimeout = null;
        }
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
          _tags = volume.MainDicomTags;
          _instanceCount = _instanceIds.length;

          elementScope.$broadcast('viewport:SetInstance', {
            id: _instanceIds[_instanceIndex],
            adaptWindowing: true,
            adaptSize: true
          });
          
          if (firstLoad) scope.$emit('serie:SerieLoaded');

          // @note transmit data to overlay
          elementScope.$broadcast('serie:SerieChanged', _tags, _instanceCount);
        });
      });
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        if (deltaX < 0 && deltaX < deltaY) {
          scope.$apply(_showPreviousInstance);

          event.preventDefault();
        }
        else if (deltaX > 0 && deltaX > deltaY) {
          // @todo calibrate the required speed and accuracy for the enduser

          scope.$apply(_showNextInstance);

          event.preventDefault();
        }
        /*
        else if (deltaX < 0 && deltaX > deltaY
              || deltaX > 0 && deltaX < deltaY
        ) {
          // @note allow normal scrolling of the window in vertical
        }
        */
      });

      function _showNextInstance(restartWhenSerieEnd) {
        if (restartWhenSerieEnd !== true) restartWhenSerieEnd = false;
        
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
