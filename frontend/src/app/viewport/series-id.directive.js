(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('vpSeriesId', vpSeriesId);

    /** <wv-viewport wv-series-id="some_series_id"></wv-viewport>
     * attributes:
     * - vp:series="$series"
     * - vp:on-series-change="youFunction($series)"
     */

    /* @ngInject */
    function vpSeriesId($parse) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            // bindToController: true,
            require: {
                'vpSeriesId': 'vpSeriesId',
                'wvViewport': 'wvViewport'
            },
            controller: SeriesViewModel,
            // controllerAs: 'vm',
            link: link,
            restrict: 'A',
            // @note use $parse to try to not dirty the scope
            scope: false
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var viewmodel = ctrls.vpSeriesId;
            var viewportController = ctrls.wvViewport;

            // Provide access to the viewport controller through the seriesId
            ctrls.vpSeriesId.getViewport = function() {
                return viewportController.getModel();
            };

            // bind view model -> viewport controller
            viewmodel.onCurrentImageIdChanged(function(imageId, isNewSeries, setShownImageCallback) {
                if (imageId) {
                    var resetViewport = isNewSeries;
                    viewportController
                        .setImage(imageId, resetViewport)
                        .then(function() {
                            if (setShownImageCallback) {
                                setShownImageCallback(imageId);
                            }
                        });
                }
                else {
                    viewportController.clearImage();
                }
            });

            // bind attributes -> view model
            var vpSeriesIdParser = $parse(attrs.vpSeriesId);
            scope.$watch(vpSeriesIdParser, function(id) {
                if (!id) {
                    viewmodel.clearSeries();
                }
                else {
                    viewmodel.setSeries(id);
                }
            });

            // bind view model -> attributes
            var vpOnSeriesChangeParser = $parse(attrs.vpOnSeriesChange);
            var wvSeriesParser = $parse(attrs.wvSeries);
            viewmodel.onSeriesChanged(function(series) {
                if (!wvSeriesParser || !wvSeriesParser.assign) {
                    return;
                }

                wvSeriesParser.assign(scope, series);

                if (vpOnSeriesChangeParser) {
                    vpOnSeriesChangeParser(scope, {$series: series});
                }
            });

            // bind view model -> extensions -> model
            _.filter(ctrls, function(ctrl, ctrlName) {
                var ctrlIsExtension = _.endsWith(ctrlName, 'SeriesExt');
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
    function SeriesViewModel(wvSeriesManager) {
        var _this = this;

        this._seriesManager = wvSeriesManager;
        this._seriesId = null;
        this._series = null;

        this.onCurrentImageIdChanged = new osimis.Listener();
        this.onSeriesChanged = new osimis.Listener();

        this.onSeriesChanged(function(newSeries, oldSeries) {
            // unbind to old series
            if (oldSeries) {
                oldSeries.onCurrentImageIdChanged.close(_this);
            }

            // bind to new series
            if (newSeries) {
                newSeries.onCurrentImageIdChanged(_this, function(imageId, setShownImageCallback) {
                    _this.onCurrentImageIdChanged.trigger(imageId, false, setShownImageCallback);
                });

                var firstImageIdInSeries = newSeries.getCurrentImageId();
                _this.onCurrentImageIdChanged.trigger(firstImageIdInSeries, true);
            }
            else {
                _this.onCurrentImageIdChanged.trigger(null);
            }
        });
    }

    SeriesViewModel.prototype.getViewport = angular.noop; // defined inside the linker

    SeriesViewModel.prototype.hasSeries = function() {
        return !!this._seriesId;
    };

    SeriesViewModel.prototype.onSeriesChanged = angular.noop;

    SeriesViewModel.prototype.clearSeries = function() {
        var oldSeries = this.series;
        this._seriesId = null;
        this._series = null;
        this.onSeriesChanged.trigger(null, oldSeries);
    };

    SeriesViewModel.prototype.setSeries = function(id) {
        var _this = this;

        this._seriesId = id;

        var oldSeries = _this._series;
        this._series = null; // Make sure getSeries returns null during the loading of the new one.

        return this._seriesManager
            .get(id)
            .then(function(series) {
                _this._series = series;
                _this.onSeriesChanged.trigger(series, oldSeries);
                return series;
            });
    };

    SeriesViewModel.prototype.getSeries = function() {
        return this._series;
    };

})();
