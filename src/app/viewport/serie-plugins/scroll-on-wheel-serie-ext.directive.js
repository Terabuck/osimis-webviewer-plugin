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
            registerMobileEvents(viewmodel);
    	};
    	this.unregister = function(viewmodel) {
            _.pull(_wvSerieIdViewModels, viewmodel);
            unregisterMobileEvents(viewmodel);
    	};
        

        /* desktop scrolling */

        hamster = hamster($element[0]);

        hamster.wheel(function(event, delta, deltaX, deltaY) {
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

            // prevent horizontal & vertical page scrolling
            event.preventDefault();
        });

        $scope.$on('$destroy', function() {
            hamster.unwheel();
        });

        /* mobile scrolling */
        
        var _hammertimeObjectsByViewport = {};
        var _mobileEvtBySerieVM = {};

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
            _mobileEvtBySerieVM[viewmodel] = onMobilePanning;
            hammertime.on('pan', _mobileEvtBySerieVM[viewmodel]);

            // React to panning
            var _lastDistance = 0;
            function onMobilePanning(evt) {
                var serie = viewmodel.getSerie();
                if (!serie) {
                    return;
                }

                // sum distances of each evt call in a common var
                // for some reasons distance = 1 seems to equals 20 pixels..
                _lastDistance += evt.distance / 20;

                // each time the distance attains the required width
                // switch image & reset the lastDistance
                var requiredDistance = ($element.width() / serie.imageCount);
                if (_lastDistance >= requiredDistance) {
                    $scope.$apply(function() {
                        if (evt.direction === Hammer.DIRECTION_LEFT) {
                            serie.goToPreviousImage();
                        }
                        else if (evt.direction === Hammer.DIRECTION_RIGHT) {
                            serie.goToNextImage(false);
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
            hammertime.off('pan', _mobileEvtBySerieVM[viewmodel])
            delete _hammertimeObjectsByViewport[viewmodel];
        }


        // listen to events...
        //mc.on("panleft panright panup pandown tap press", function(ev) {
        //    myElement.textContent = ev.type +" gesture detected.";
        //});

    }
})();