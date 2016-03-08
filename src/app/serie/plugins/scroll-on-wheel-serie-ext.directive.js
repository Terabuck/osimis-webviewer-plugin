(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvScrollOnWheelSerieExt', wvScrollOnWheelSerieExt)
        .config(function($provide) {
        	$provide.decorator('wvSerieIdDirective', function($delegate) {
			    var directive = $delegate[0];
		    	directive.require['wvScrollOnWheelSerieExt'] = '?^wvScrollOnWheelSerieExt';

                return $delegate;
        	});
        });

    /* @ngInject */
    function wvScrollOnWheelSerieExt() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller($scope, $element, $attrs, hamster) {
        var _wvSerieIdViewModels = [];
    	this.register = function(viewmodel) {
            _wvSerieIdViewModels.push(viewmodel);
    	};
    	this.unregister = function(viewmodel) {
            _.pull(_wvSerieIdViewModels, viewmodel);
    	};

        // var _cancelAnimationId = null;
        hamster($element[0]).wheel(function(event, delta, deltaX, deltaY) {
            // if (_cancelAnimationId) {
            //     cancelAnimationFrame(_cancelAnimationId);
            //     _cancelAnimationId = null;
            // }
            // _cancelAnimationId = requestAnimationFrame(function() {
                $scope.$apply(function() {
                    _wvSerieIdViewModels.forEach(function(viewmodel) {
                        var serie = viewmodel.getSerie();
                        
                        if (!serie) {
                            return;
                        }
                        else if (deltaY < 0) {
                            serie.goToPreviousImage();
                        }
                        else if (deltaY > 0) {
                            // @todo calibrate the required speed and accuracy for the enduser
                            serie.goToNextImage(false);
                        }
                    });
                });
            // });

            // prevent horizontal & vertical page scrolling
            event.preventDefault();
        });

        $scope.$on('$destroy', function() {
            // if (_cancelAnimationId) {
            //     cancelAnimationFrame(_cancelAnimationId);
            //     _cancelAnimationId = null;
            // }
            hamster($element[0]).unwheel();
        });
    }
})();