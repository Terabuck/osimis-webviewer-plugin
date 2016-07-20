(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvScrollOnWheelSeriesExt', wvScrollOnWheelSeriesExt)
        .config(function($provide) {
        	$provide.decorator('wvSeriesIdDirective', function($delegate) {
			    var directive = $delegate[0];
		    	directive.require['wvScrollOnWheelSeriesExt'] = '?^wvScrollOnWheelSeriesExt';

                return $delegate;
        	});
        });

    /* @ngInject */
    function wvScrollOnWheelSeriesExt() {
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
        var _wvSeriesIdViewModels = [];
    	this.register = function(viewmodel) {
            _wvSeriesIdViewModels.push(viewmodel);
            registerMobileEvents(viewmodel);
    	};
    	this.unregister = function(viewmodel) {
            _.pull(_wvSeriesIdViewModels, viewmodel);
            unregisterMobileEvents(viewmodel);
    	};
        

        /* desktop scrolling */

        hamster = hamster($element[0]);

        hamster.wheel(function(event, delta, deltaX, deltaY) {
            $scope.$apply(function() {
                _wvSeriesIdViewModels.forEach(function(viewmodel) {
                    var series = viewmodel.getSeries();
                    
                    if (!series) {
                        return;
                    }
                    else if (deltaY < 0) {
                        series.goToPreviousImage();
                    }
                    else if (deltaY > 0) {
                        // @todo calibrate the required speed and accuracy for the enduser
                        series.goToNextImage(false);
                    }
                });
            });

            // prevent horizontal & vertical page scrolling
            event.preventDefault();
        });

        $scope.$on('$destroy', function() {
            hamster.unwheel();
        });

        /* mobile scrolling */
        
        var _hammertimeObjectsByViewport = {};
        var _mobileEvtBySeriesVM = {};

        function registerMobileEvents(viewmodel) {
            // Configure the dom element
            // Use the enabledElement instead of the current element 
            // to avoid hammertime making the overlay unselectable
            var enabledElement = viewmodel.getViewport().getEnabledElement();
            var hammertime = new Hammer(enabledElement, {
                inputClass: Hammer.TouchInput // disable panning on desktop
            });
            hammertime.get('pan').set({
                direction: Hammer.DIRECTION_HORIZONTAL,
                pointers: 1
            });

            // Cache the hammertime object for future destruction
            _hammertimeObjectsByViewport[viewmodel] = hammertime;

            // Add the panning event
            _mobileEvtBySeriesVM[viewmodel] = onMobilePanning;
            hammertime.on('pan', _mobileEvtBySeriesVM[viewmodel]);

            // React to panning
            var _lastDistance = 0;
            function onMobilePanning(evt) {
                var series = viewmodel.getSeries();
                if (!series) {
                    return;
                }

                // sum distances of each evt call in a common var
                // for some reasons distance = 1 seems to equals 20 pixels..
                _lastDistance += evt.distance / 20;

                // each time the distance attains the required width
                // switch image & reset the lastDistance
                var requiredDistance = ($element.width() / series.imageCount);
                if (_lastDistance >= requiredDistance) {
                    $scope.$apply(function() {
                        if (evt.direction === Hammer.DIRECTION_LEFT) {
                            series.goToPreviousImage();
                        }
                        else if (evt.direction === Hammer.DIRECTION_RIGHT) {
                            series.goToNextImage(false);
                        }
                    });
                    
                    // set lastDistance to the remaining distance
                    _lastDistance = _lastDistance % requiredDistance;
                }

                // reset the distance when the gesture starts
                if (evt.isFinal) {
                    _lastDistance = 0;
                }
            }
        };
        function unregisterMobileEvents(viewmodel) {
            var hammertime = _hammertimeObjectsByViewport[viewmodel];
            hammertime.off('pan', _mobileEvtBySeriesVM[viewmodel])
            delete _hammertimeObjectsByViewport[viewmodel];
        }


        // listen to events...
        //mc.on("panleft panright panup pandown tap press", function(ev) {
        //    myElement.textContent = ev.type +" gesture detected.";
        //});

    }
})();