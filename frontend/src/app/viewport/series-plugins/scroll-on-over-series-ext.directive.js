(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvScrollOnOverSeriesExt', wvScrollOnOverSeriesExt)
        .config(function($provide) {
        	$provide.decorator('vpSeriesIdDirective', function($delegate) {
			    var directive = $delegate[0];
		    	directive.require['wvScrollOnOverSeriesExt'] = '?^wvScrollOnOverSeriesExt';

                return $delegate;
        	});
        });

    /* @ngInject */
    function wvScrollOnOverSeriesExt() {
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
        var _wvSeriesIdViewModels = [];
    	this.register = function(viewmodel) {
            _wvSeriesIdViewModels.push(viewmodel);
    	};
    	this.unregister = function(viewmodel) {
            _.pull(_wvSeriesIdViewModels, viewmodel);
    	};

        $element
            .on('mouseover', mouseoverEvt)
            .on('mouseout', mouseoutEvt);

        $scope.$on('$destroy', function() {
            _wvSeriesIdViewModels.forEach(function(viewmodel) {
                var series = viewmodel.getSeries();
                if (!series) {
                    return;
                }
                series.pause();
            });
            $element.off('mouseover', mouseoverEvt);
            $element.off('mouseout', mouseoutEvt);
        });

        function mouseoverEvt() {
            $scope.$apply(function() {
                _wvSeriesIdViewModels.forEach(function(viewmodel) {
                    var series = viewmodel.getSeries();
                    if (!series) {
                        return;
                    }
                    
                    series.play();
                });
            });
        }
        function mouseoutEvt() {
            $scope.$apply(function() {
                _wvSeriesIdViewModels.forEach(function(viewmodel) {
                    var series = viewmodel.getSeries();
                    if (!series) {
                        return;
                    }

                    series.pause();
                    series.goToImage(0);
                });
            });
        }
    }
})();