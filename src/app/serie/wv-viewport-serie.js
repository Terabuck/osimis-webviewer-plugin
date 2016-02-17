'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvViewportSerie
 * @description
 * # wvViewportSerie
 */

 // one viewport at most
angular.module('webviewer')
.directive('wvViewportSerie', ['$timeout', '$parse', '$q', 'orthancApiService', 'wvSerieRepository',
function($timeout, $parse, $q, orthancApiService, wvSerieRepository) {
return {
    scope: false,
    restrict: 'A',
    require: ['wvViewportSerie', 'wvViewport'],
    controller: function($q, $scope, $element) {
      var _this = this;

      // @todo this is the component controller !
      // it should be used to set the paths and vars only
      // and to control the model.

      // this.id = undefined; // @todo update scope on change
      // this.instanceCount = 0;
      this._serie = null;
      this._instanceCtrl = null;

      this.setInstanceController = function(instanceCtrl) {
        this._instanceCtrl = instanceCtrl;
      };

      this.getSerie = function() {
        return this._serie;
      };

      this.setSerie = function(opts) {
        var id = opts.id;
        
        if (this._serie && this._serie.id === id) {
          // no change
          return;
        }

        if (!id) {
          this._disable();
        }
        else if (!this._serie) {
          this._enable(id)
          .then(_onSerieChange);
        }
        else {
          this._disable();

          this._enable(id)
          .then(_onSerieChange);
        }
      };

      this._disable = angular.noop;

      this._enable = function(id) {
        var _this = this;
        var deferred = $q.defer();

        wvSerieRepository
        .get(id)
        .then(function(series) {
          _this._serie = series[0];
          
          // bind the serie model with viewport/instance controller
          var unlisten = $scope.$watch(function() {
            return _this._serie && _this._serie.getActualInstanceId();
          }, function(instanceId, old) {
            _this._instanceCtrl.setInstance({
              id: instanceId,
              adaptWindowing: false,
              adaptSize: false
            });
            
            if (instanceId === old) { // first load
              deferred.resolve(_this._serie);
            };
          });

          _this._disable = function() {
            unlisten();
            _this._disable = angular.noop;
          }
        });

        return deferred.promise;
      };

      function _onSerieChange(serie) {
        $scope.$emit('SerieHasChanged', serie);

        // @note used by
        // - wv-overlay
        // @todo use directive attribute transmission instead
        var elementScope = angular.element($element).isolateScope();
        elementScope.$broadcast('SerieHasChanged', serie);
      }

      // @note
      // - used by scroll on over
      // - used by play state
      $scope.$on('PlaySerie', function(evt, args) {
        if (!_this._serie) {
          return;
        }

        var speed = args && args.speed;

        _this._serie.play(speed);
      });

      // @note
      // - used by scroll on over
      // - used by play state
      $scope.$on('PauseSerie', function(evt, args) {
        if (!_this._serie) {
          return;
        }

        _this._serie.pause();
      });
    },
    link: function postLink(scope, element, attrs, ctrls) {
      var ctrl = ctrls[0];
      var instanceController = ctrls[1];

      ctrl.setInstanceController(instanceController);
      
      var wvViewportSerie = $parse(attrs.wvViewportSerie);
      scope.$watch(function() {
        return wvViewportSerie(scope).id;
      }, function(id) {
        ctrl.setSerie({id: id})
      });
    }
};
}]);
