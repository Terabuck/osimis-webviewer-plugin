(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvPlaySerieExt', wvPlaySerieExt)
        .config(function($provide) {
            $provide.decorator('wvSerieIdDirective', function($delegate) {
                var directive = $delegate[0];
                directive.require['wvPlaySerieExt'] = '?^wvPlaySerieExt';

                return $delegate;
            });
        });

    /* @ngInject */
    function wvPlaySerieExt($parse) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            require: 'wvPlaySerieExt',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs, tool) {
            var wvPlaySerieExtParser = $parse(attrs.wvPlaySerieExt);
            
            // bind attributes -> tool
            scope.$watch(wvPlaySerieExtParser, function(isActivated) {
                if (isActivated) {
                    tool.activate();
                }
                else {
                    tool.deactivate();
                }
            });
        }
    }

    /* @ngInject */
    function Controller($scope, $element, $attrs) {
        var _this = this;

        var _wvSerieIdViewModels = [];

        this.isActivated = false;

        this.register = function(viewmodel) {
            _wvSerieIdViewModels.push(viewmodel);

            var serie = viewmodel.getSerie();
            if (this.isActivated && serie) {
                this.activate(serie);
            }
            
            viewmodel.onSerieChanged(this, function(newSerie, oldSerie) {
                if (oldSerie && _this.isActivated) {
                    _this.deactivate(oldSerie);
                }
                if (newSerie && _this.isActivated) {
                    _this.activate(newSerie);
                }
            });
        };
        this.unregister = function(viewmodel) {
            _.pull(_wvSerieIdViewModels, viewmodel);
            
            viewmodel.onSerieChanged.close(this);
            var serie = viewmodel.getSerie();
            this.deactivate(serie);
        };

        this.activate = function(serie) {
            if (typeof serie === 'undefined') {
                _wvSerieIdViewModels.forEach(function(vm) {
                    var serie = vm.getSerie();
                    _this.activate(serie)
                });
                this.isActivated = true;
            }
            else {
                if (serie && !serie.isPlaying) {
                    serie.play();
                }
            }
        };
        this.deactivate = function(serie) {
            if (typeof serie === 'undefined') {
                _wvSerieIdViewModels.forEach(function(vm) {
                    var serie = vm.getSerie();
                    _this.deactivate(serie)
                });
                this.isActivated = false;
            }
            else {
                if (serie && serie.isPlaying) {
                    serie.pause();
                }
            }
        };

    }
})();
