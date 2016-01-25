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
      this.id = undefined; // @todo update scope on change
      this.instanceCount = 0;
    },
    link: function postLink(scope, element, attrs, ctrl) {
      var elementScope = angular.element(element).isolateScope(); // @todo require ctrl instead
      
      var _instanceIds = [];
      var _instanceIndex = 0;
      var _tags = null;
      
      ctrl.setSerie = function(args) {
        var id = args.id;
        ctrl.id = id;
      };
      ctrl.showNextInstance = _showNextInstance;
      ctrl.showPreviousInstance = _showPreviousInstance;

      if (attrs.wvViewportSerie) {
        // @todo more generic way
        var wvInstance = scope[attrs.wvViewportSerie];
        if (typeof wvInstance !== 'object') {
          ctrl.id = wvInstance;
        }
        else {
          ctrl.id = wvInstance.id;
        }
        scope[attrs.wvViewportSerie] = ctrl;
      }

      scope.$on('serie:GetSerieData', function(evt, fn) {
        fn(_tags, ctrl.instanceCount);
      });
      scope.$on('serie:GetSerieId', function(evt, fn) {
        fn(ctrl.id);
      })
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
      scope.$on('serie:GoToSerieIndex', function(evt, args) {
        var index = args.index;

        if (index < 0) {
          index = 0;
        }
        else if (index + 1 > ctrl.instanceCount) {
          return;
        }

        _instanceIndex = index;
        
        elementScope.$broadcast('viewport:SetInstance', {
          id: _instanceIds[_instanceIndex],
          adaptWindowing: false,
          adaptSize: false
        });
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

      scope.$watch(function() {
        return ctrl.id;
      }, function(serieId, old) {
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
          ctrl.instanceCount = _instanceIds.length;

          elementScope.$broadcast('viewport:SetInstance', {
            id: _instanceIds[_instanceIndex],
            adaptWindowing: true,
            adaptSize: true
          });
          
          if (firstLoad) scope.$emit('serie:SerieLoaded');

          // @note transmit data to overlay
          elementScope.$broadcast('serie:SerieChanged', _tags, ctrl.instanceCount);

          // @note preload every instance images.
          // @todo refactor
          $timeout(function() {
            // wait 250ms that main image is shown
            (function _preloadImage(index) {
              if (index + 1 > ctrl.instanceCount) return;

              var id = _instanceIds[index];

              cornerstone
              .loadAndCacheImage(id)
              .then(function() {
                // load tags once image loaded
                orthancApiService.instance.getTags({id: id});
                // load next image
                _preloadImage(index + 1);
              });
            })(0);
          }, 1000);
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
