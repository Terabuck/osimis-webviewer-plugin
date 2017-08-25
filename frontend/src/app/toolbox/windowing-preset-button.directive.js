(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvWindowingPresetButton', wvWindowingPresetButton);

    /* @ngInject */
    function wvWindowingPresetButton($timeout) {
        var directive = {
            bindToController: true,
            controller: WindowingPresetButtonVM,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                onWindowingPresetSelected: '&wvOnWindowingPresetSelected',
                windowingPresets: '=wvWindowingPresets',
                selectedTool: '=wvSelectedTool',
                readonly: '=?wvReadonly',
                popoverPlacement: '@?wvPopoverPlacement'
            },
            templateUrl: 'app/toolbox/windowing-preset-button.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;

            var buttonEl = element.children().first();
            
            // Toggle popover on mouse over/out.
            buttonEl.bind('mouseenter', function (e) {
                if (!vm.readonly && !vm.insidePopover) {
                    try {
                        vm.popover.show();
                    }
                    catch (e) {
                        // Ignore `Cannot read property '0' of undefined` exception when 
                        // the button is hovered at app startup. This as no negative
                        // effect.
                    }
                    vm.attachEventsToPopoverContent();
                }
            });

            buttonEl.bind('mouseleave', function (e) {
                // Timeout to make sure the user can move it's cursor from the button
                // to the popover without having the popover to hide in between.
                $timeout(function () {
                    if (!vm.insidePopover) {
                        vm.popover.hide();
                    }
                }, 100);
            });
        }
    }

    /* @ngInject */
    function WindowingPresetButtonVM($q, $element, $scope, $popover, wvPaneManager) {
        var _this = this;
        var buttonEl = $element.children().first();

        this.readonly = typeof this.readonly !== 'undefined' ? this.readonly : false;
        this.popoverPlacement = typeof this.popoverPlacement !== 'undefined' ? this.popoverPlacement : 'bottom';
        this.insidePopover = false;

        // Don't exit popover on when mouse leave the button.
        this.attachEventsToPopoverContent = function () {
            $(_this.popover.$element).on('mouseenter', function () {
                _this.insidePopover = true;
            });
            $(_this.popover.$element).on('mouseleave', function () {
                _this.insidePopover = false;
                _this.popover.hide();
            });
        };
        
        // Popover configuration
        var popoverScope = $scope.$new();
        this.popover = $popover(buttonEl, {
            content: 'Windowing Presets',
            placement: _this.popoverPlacement,
            container: 'body',
            trigger: 'manual',
            templateUrl: 'app/toolbox/windowing-preset-button.popover.html',
            onBeforeShow: function() {
                // @warning The following source code is not databound in real time. If one of the used 
                //    model changes, the windowing presets will only be adapted next time  the popover is
                //    displayed.

                // Clean up scope.
                popoverScope.embeddedWindowings = [];

                // Set up windowing presets.
                popoverScope.windowingPresets = _this.windowingPresets;

                // Set windowings specific to the selected viewport (either preset set in the dicom file
                // or which has been processed by the viewer in the web workers).
                var selectedPane = wvPaneManager.getSelectedPane();
                selectedPane
                    .getImage()
                    .then(function(image) {
                        // Ignore if the selected viewport doesn't contain an image.
                        if (!image) {
                            // @todo
                            // _this.hidePresets = true;
                            return;
                        }
                        else {
                            // @todo
                            // _this.hidePresets = false;
                        }

                        // Get default windowing (either set via a dicom tag or processed in a
                        // web worker just after the image is downloaded).
                        return $q.all([
                            $q.when(image),
                            image
                                .getBestBinaryInCache()
                                .then(function(imageBinary) {
                                    // Ignore if no image binary has been loaded yet.
                                    if (!imageBinary) {
                                        return;
                                    }

                                    // Return default windowing.
                                    return {
                                        windowCenter: +imageBinary.windowCenter,
                                        windowWidth: +imageBinary.windowWidth
                                    };
                                })
                        ]);
                    })
                    .then(function(result) {
                        // Ignore selected pane without images.
                        if (!result || result.length < 1) {
                            return;
                        }
                        
                        var image = result[0];
                        var defaultWindowing = result[1];

                        // Process windowing presets inside dicom.
                        var windowCenters = image.tags.WindowCenter && image.tags.WindowCenter.split('\\');
                        var windowWidths = image.tags.WindowWidth && image.tags.WindowWidth.split('\\');

                        // Ignore method if there is no windowing tag.
                        if (!windowCenters || !windowWidths) {
                            return;
                        }

                        // Assert there are as many window width preset than window center ones.
                        if (windowCenters.length !== windowWidths.length) {
                            throw new Error('WindowWidth DICOM tags doesn\'t fit WindowCenter one.');
                        }

                        // Merge windowCenters and windowWidths arrays in a single one.
                        popoverScope.embeddedWindowings = windowCenters
                            .map(function(windowCenter, index) {
                                return {
                                    windowCenter: +windowCenter,
                                    windowWidth: +windowWidths[index]
                                }
                            });

                        // Push default windowing in front.
                        if (defaultWindowing) {
                            popoverScope.embeddedWindowings = [
                                defaultWindowing
                            ].concat(popoverScope.embeddedWindowings);
                        }
                        else {
                            // This happens only when no binary has been loaded yet. In this case,
                            // we only show windowing as set in the dicom file.
                        }

                        // Remove duplicates (this happens for instance when the default windowing has been
                        // retrieved from the dicom tags).
                        popoverScope.embeddedWindowings = _.uniqWith(popoverScope.embeddedWindowings, _.isEqual);
                    });
            },

            // Option documented in `ngTooltip`, not `ngPopover`, see
            // `https://stackoverflow.com/questions/28021917/angular-strap-popover-programmatic-use`.
            scope: popoverScope
        });
        $scope.$on('$destroy', function() {
            popoverScope.$destroy();
        });

        // Apply windowing preset to the selected pane.
        popoverScope.applyWindowing = function(windowWidth, windowCenter) {
            _this.onWindowingPresetSelected({
                $windowWidth: windowWidth,
                $windowCenter: windowCenter
            });
        };
    }
})();
