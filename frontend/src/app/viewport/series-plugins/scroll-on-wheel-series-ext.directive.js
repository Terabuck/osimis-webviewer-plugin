/**
 * @ngdoc directive
 * @name webviewer.directive:wvScrollOnWheelSeriesExt
 * 
 * @param {boolean} [wvScrollOnWheelSeriesExt=true] Makes the viewport
 *                                                  scrollable.
 * 
 * @restrict A
 * @requires webviewer.directive:wvViewport
 * @requires webviewer.directive:vpSeriesId
 * 
 * @description
 * The `wvScrollOnWheelSeriesExt` directive let the end-user scroll through a
 * viewport's series via the mouse wheel (or via fingers on mobile).
 **/
 (function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvScrollOnWheelSeriesExt', wvScrollOnWheelSeriesExt)
        .config(function($provide) {
        	$provide.decorator('vpSeriesIdDirective', function($delegate) {
			    var directive = $delegate[0];
		    	directive.require['wvScrollOnWheelSeriesExt'] = '?^wvScrollOnWheelSeriesExt';

                return $delegate;
        	});
        });

    /* @ngInject */
    function wvScrollOnWheelSeriesExt($parse) {
        var directive = {
            require: 'wvScrollOnWheelSeriesExt',
            controller: Controller,
            link: link,
            restrict: 'A',
            scope: false
        };
        return directive;

        function link(scope, element, attrs, tool) {
            // Switch activate/deactivate based on databound HTML attribute
            var wvScrollOnWheelSeriesExt = $parse(attrs.wvScrollOnWheelSeriesExt);
            scope.$watch(wvScrollOnWheelSeriesExt, function(isActivated) {
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
    function Controller($scope, $element, $attrs, hamster) {
        var _wvSeriesIdViewModels = [];
    	this.register = function(viewmodel) {
            _wvSeriesIdViewModels.push(viewmodel);
    	};
    	this.unregister = function(viewmodel) {
            _.pull(_wvSeriesIdViewModels, viewmodel);
    	};
        
        this.activate = function() {
            _wvSeriesIdViewModels
                .forEach(registerDesktopEvents);
            _wvSeriesIdViewModels
                .forEach(registerMobileEvents);
        };
        this.deactivate = function() {
            _wvSeriesIdViewModels
                .forEach(unregisterDesktopEvents);
            _wvSeriesIdViewModels
                .forEach(unregisterMobileEvents);
        };

        // Free events on destroy
        $scope.$on('$destroy', function() {
            unregisterDesktopEvents();
            unregisterMobileEvents();
        });

        /* desktop scrolling */
        
        var hamsterInstance;
        function registerDesktopEvents(viewmodel) {
            // @warning This will only work for one viewport by scrollOnWheel extension
            // we don't need more however. Assert this.
            if (_wvSeriesIdViewModels.length > 1) {
                throw new Error("More than one viewport when using `wvpScrollOnOverSeriesExt` directive.");
            }

            hamsterInstance = hamster($element[0]);
            hamsterInstance.wheel(function(event, delta, deltaX, deltaY) {
                $scope.$apply(function() {
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

                // prevent horizontal & vertical page scrolling
                event.preventDefault();
            });
        }

        function unregisterDesktopEvents(viewmodel) {
            if (hamsterInstance) {
                // This won't disable events from other viewports due to the way
                // hamster is instanciated.
                if (hamsterInstance.unwheel) {
                    hamsterInstance.unwheel();
                }
                
                hamsterInstance = null;
            }
        }

        /* mobile scrolling */
        
        var _hammertimeObjectsByViewport = {};
        var _mobileEvtBySeriesVM = {};

        function registerMobileEvents(viewmodel) {
            // Prevent on non-mobile platform (ie. desktop touchscreen) to 
            // avoid conflicts with other tools such as paning.
            var uaParser = new UAParser();
            vm.isMobile = (uaParser.getDevice().type === 'mobile');
            if (!isMobile) {
                return;
            }

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
            // Prevent on non-mobile platform (ie. desktop touchscreen) to 
            // avoid conflicts with other tools such as paning.
            var uaParser = new UAParser();
            vm.isMobile = (uaParser.getDevice().type === 'mobile');
            if (!isMobile) {
                return;
            }
            
            if (_hammertimeObjectsByViewport[viewmodel]) {
                var hammertime = _hammertimeObjectsByViewport[viewmodel];
                hammertime.off('pan', _mobileEvtBySeriesVM[viewmodel])
                delete _hammertimeObjectsByViewport[viewmodel];
            }
        }


        // listen to events...
        //mc.on("panleft panright panup pandown tap press", function(ev) {
        //    myElement.textContent = ev.type +" gesture detected.";
        //});

    }
})();