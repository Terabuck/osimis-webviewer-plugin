(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvSerieId', wvSerieId);

    /* @ngInject */
    function wvSerieId($parse) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            // bindToController: true,
            require: {
                'wvSerieId': 'wvSerieId',
                'wvViewport': 'wvViewport'
            },
            controller: SerieViewModel,
            // controllerAs: 'vm',
            link: link,
            restrict: 'A',
            // @note use $parse to try to not dirty the scope
            scope: false
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var viewmodel = ctrls.wvSerieId;
            var viewportController = ctrls.wvViewport;

            // bind view model -> viewport controller
            viewmodel.onCurrentImageIdChanged(function(imageId, isNewSerie) {
                if (imageId) {
                    viewportController.setImage(imageId, isNewSerie ? true : false);
                }
                else {
                    viewportController.clearImage();
                }
            });

            // bind attributes -> view model
            var wvSerieIdParser = $parse(attrs.wvSerieId);
            scope.$watch(wvSerieIdParser, function(id) {
                if (!id) {
                    viewmodel.clearSerie();
                }
                else {
                    viewmodel.setSerie(id);
                }
            });

            // bind view model -> attributes
            var wvSerieParser = $parse(attrs.wvSerie);
            viewmodel.onSerieChanged(function(serie) {
                if (!wvSerieParser || !wvSerieParser.assign) {
                    return;
                }
                
                wvSerieParser.assign(scope, serie);
            });

            // bind view model -> extensions -> model
            _.filter(ctrls, function(ctrl, ctrlName) {
                var ctrlIsExtension = _.endsWith(ctrlName, 'SerieExt');
                if (!ctrl) {
                    return;
                }
                else if (ctrlIsExtension) {
                    ctrl.register(viewmodel);
                    
                    scope.$on('$destroy', function() {
                        ctrl.unregister(viewmodel);
                    });
                }
            });

        }
    }

    /* responsibility: manage the directive states */
    /* @ngInject */
    function SerieViewModel(wvSerieRepository) {
        var _this = this;

        this._serieRepository = wvSerieRepository;
        this._serieId = null;
        this._serie = null;

        this.onCurrentImageIdChanged = new osimis.Listener();
        this.onSerieChanged = new osimis.Listener();

        this.onSerieChanged(function(newSerie, oldSerie) {
            // unbind to old serie
            if (oldSerie) {
                oldSerie.onCurrentImageIdChanged.close(_this);
            }

            // bind to new serie
            if (newSerie) {
                newSerie.onCurrentImageIdChanged(_this, function(imageId) {
                    _this.onCurrentImageIdChanged.trigger(imageId);
                });

                var firstImageIdInSerie = newSerie.getCurrentImageId();
                _this.onCurrentImageIdChanged.trigger(firstImageIdInSerie, true);
            }
            else {
                _this.onCurrentImageIdChanged.trigger(null);
            }
        });
    }
    
    SerieViewModel.prototype.onSerieChanged = angular.noop;
    
    SerieViewModel.prototype.clearSerie = function() {
        var oldSerie = this.serie;
        this._serieId = null;
        this._serie = null;
        this.onSerieChanged.trigger(null, oldSerie);
    };

    SerieViewModel.prototype.setSerie = function(id) {
        var _this = this;

        this._serieId = id;

        this._serieRepository
            .get(id)
            .then(function(serie) {
                var oldSerie = _this._serie;
                _this._serie = serie;
                _this.onSerieChanged.trigger(serie, oldSerie);
            });
    };

    SerieViewModel.prototype.getSerie = function() {
        return this._serie;
    };
    
})();