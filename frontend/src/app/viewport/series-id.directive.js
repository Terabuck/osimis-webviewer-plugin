/**
 * @ngdoc
 * @name wvSeriesId
 *
 * @description
 * The `wvSeriesId` directive is an extension of the `wvViewport` directive.
 * It sets and updates the images displayed on the viewport, based on the one available in the series.
 * The relative series model can be retrieved via attribute and therefore be controlled externaly.
 * 
 * This directive is also meant to be extended the same way `wvViewport` is.
 * Have a look at the _series-plugins/_ folder for an exhaustive list of series-related features.
 *
 * @restrict A
 *
 * @require wvViewport
 *
 * @param {series_id} wvSeriesId (optional) The id of the displayed series.
 *   It can also be set using inter-directive communication, therefore this attribute is optional and may
 *   be changed by the directive itself.
 *   series_id = <orthanc-series-id>:<instance-index> where instance-index = n ⊂ [0; Infinity]
 *   In case of multiframe instances, multiple orthanc series can relates to multiple viewport
 *   series_id (one multiframe instance is converted into one web viewer series).
 *
 * @param {series_model} wvSeries (optional, readonly) Share the series model instance.
 *   The series-id directive handles the series model loading. Therefore, it also provide access to it.
 *   This is done through this attribute, which should only be used to retrieve the model, not to set it.
 *
 * @param {callback} wvOnSeriesChange (optional, callback) Triggered when the series has changed
 *   Available Callback Arguments:
 *   * `$series` - series_model
 *
 * @example Display a specific series with some informations and a play button
 * ```html
 * <wv-viewport wv-series-id="'your-series-id'" wv-series="$series" wv-size="{width: '100px', height: '100px'}"
 *              wv-image-id="imageId" wv-image="$image" wv-lossless="true"
 * ></wv-viewport>
 * <p>{{imageId}}: {{$image.tags.PatientName}}</p>
 * <button ng-click="$series.play()">Play the series!</button>
 * ```
 * The imageId is defined by the wvSeriesId directive. However,
 * you can still use wv-image-id to retrieve the imageId, and you can
 * still access the image model via the wv-image attribute.
 **/
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('vpSeriesId', vpSeriesId);

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
