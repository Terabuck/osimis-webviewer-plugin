(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvScrollOnOverSerieExt', wvScrollOnOverSerieExt)
        .config(function($provide) {
        	$provide.decorator('wvSerieIdDirective', function($delegate) {
			    var directive = $delegate[0];
		    	directive.require['wvScrollOnOverSerieExt'] = '?^wvScrollOnOverSerieExt';

                return $delegate;
        	});
        });

    /* @ngInject */
    function wvScrollOnOverSerieExt() {
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
    function Controller($scope, $element, $attrs) {
        var _wvSerieIdViewModels = [];
    	this.register = function(viewmodel) {
            _wvSerieIdViewModels.push(viewmodel);
    	};
    	this.unregister = function(viewmodel) {
            _.pull(_wvSerieIdViewModels, viewmodel);
    	};

        $element
            .on('mouseover', mouseoverEvt)
            .on('mouseout', mouseoutEvt);

        $scope.$on('$destroy', function() {
            _wvSerieIdViewModels.forEach(function(viewmodel) {
                var serie = viewmodel.getSerie();
                if (!serie) {
                    return;
                }
                serie.pause();
            })
            $element.off('mouseover', mouseoverEvt);
            $element.off('mouseout', mouseoutEvt);
        });

        function mouseoverEvt() {
            _wvSerieIdViewModels.forEach(function(viewmodel) {
                var serie = viewmodel.getSerie();
                if (!serie) {
                    return;
                }
                serie.play(1000/25); // 25fps
            });
        }
        function mouseoutEvt() {
            _wvSerieIdViewModels.forEach(function(viewmodel) {
                var serie = viewmodel.getSerie();
                if (!serie) {
                    return;
                }
                serie.pause();
                //  speed: 1000/25 // 25fps
            });
        }
    }
})();