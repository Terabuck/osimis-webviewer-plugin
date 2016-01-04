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
      ctrl.showNextInstance = _showNextInstance;
      ctrl.showPreviousInstance = _showPreviousInstance;

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
      scope.$on('serie:ShowPreviousInstance', function(evt, args) {
        _showPreviousInstance();
      });

      var nextTimeout = null;
      var playing = false;
      scope.$on('serie:Play', function(evt, args) {
        if (playing) return;
        playing = true;

        var speed = args && args.speed;

        if (speed) {
          function processNextIteration1() {
            nextTimeout = $timeout(function() {
              _showNextInstance(true);
              if (playing)
                scope.$evalAsync(processNextIteration1);
            }, speed);
          }
          processNextIteration1();
        }
        else {
          // @note very approximative algorithm to automaticaly set speed
          var mmPerSeconds = 25;
          function processNextIteration2() {
            elementScope.$broadcast('viewport:GetInstanceData', function(tags) {
              if (!tags) return;

              var size = +tags.SliceThickness + (+tags.SpacingBetweenSlices || 0); // @todo calculate SpacingBetweenSlices using positions and orientation...
              var fps = mmPerSeconds / size;
              speed = Math.round(1000 / fps);

              nextTimeout = $timeout(function() {
                _showNextInstance(true);
                if (playing)
                  scope.$evalAsync(processNextIteration2);
              }, speed);
            });
          }
          processNextIteration2();
        }
      });
      scope.$on('serie:Pause', function(evt, args) {
        if (nextTimeout) {
          $timeout.cancel(nextTimeout);
          nextTimeout = null;
        }
        playing = false;
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
