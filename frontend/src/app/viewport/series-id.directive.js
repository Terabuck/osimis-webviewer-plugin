/**
 * @ngdoc directive
 * 
 * @name webviewer.directive:vpSeriesId
 *
 * @param {string} [vpSeriesId] The id of the displayed series.
 *   It can also be set using inter-directive communication, therefore this attribute is optional and may
 *   be changed by the directive itself.
 *   series_id = <orthanc-series-id>:<instance-index> where instance-index = n ⊂ [0; Infinity]
 *   In case of multiframe instances, multiple orthanc series can relates to multiple viewport
 *   series_id (one multiframe instance is converted into one web viewer series).
 *   Cornerstone viewport data has to be manually reset when the series change (ie.
 *   on drag&drop).
 *
 * @param {osimis.Series} [wvSeries] (readonly) Share the series model instance.
 *   The series-id directive handles the series model loading. Therefore, it also provide access to it.
 *   This is done through this attribute, which should only be used to retrieve the model, not to set it.
 *
 * @param {callback} [wvOnSeriesChange] Triggered when the series has changed
 *   Available Callback Arguments:
 *   * `$series` - series_model
 *
 * @param {integer} wvImageIndex Index of the actual image in the series.
 *    Notably used by the liveshare feature to save the current state of the series.
 *    Note the value may be different from the displayed image's index when an
 *    image is waiting loading to finish before display. The image index has to
 *    be manually reset to 0 when the series change (ie. on drag&drop).
 *
 * @restrict Attribute
 * @requires webviewer.directive:wvViewport
 * 
 * @description
 * The `vpSeriesId` directive is an extension of the `wvViewport` directive.
 * It sets and updates the images displayed on the viewport, based on the one available in the series.
 * The relative series model can be retrieved via attribute and therefore be controlled externaly.
 * 
 * This directive is also meant to be extended the same way `wvViewport` is.
 * Have a look at the _series-plugins/_ folder for an exhaustive list of series-related features.
 * 
 * @example
 * Display a specific series with some informations and a play button:
 * 
 * ```html
 * <wv-viewport wv-series-id="'your-series-id'" wv-series="$series" wv-size="{width: '100px', height: '100px'}"
 *              wv-image-id="imageId" wv-image="$image" wv-lossless="true"
 * ></wv-viewport>
 * <p>{{imageId}}: {{$image.tags.PatientName}}</p>
 * <button ng-click="$series.play()">Play the series!</button>
 * ```
 * The imageId is defined by the vpSeriesId directive. However,
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
        var directive = {
            require: {
                'vpSeriesId': 'vpSeriesId',
                'wvViewport': 'wvViewport'
            },
            controller: SeriesViewModel,
            link: link,
            restrict: 'A',
            scope: false // we use $parse instead to try to not dirty the scope
        };
        return directive;

        function link(scope, element, attrs, ctrls) {
            var viewmodel = ctrls.vpSeriesId;
            var viewportController = ctrls.wvViewport;
            var wvImageIndexParser = $parse(attrs.wvImageIndex);

            /**
             * AngularJS' directives provide three ways to communicate with the external world:
             * - Attribute data binding (via either $parse($attrs...) or the directive's scope attribute)
             * - Scope (via either direct access or transclusion + scope inheritance for instance)
             * - Controller injectection (via directive's require attribute)
             *
             * In this directive, we make use of multiple ones at once.
             *
             * 
             * These ways however do not work well together, and produce infine recursive loops:
             * 
             * [call to controller] ctrl->setSmtg('data');
             *                   |     •
             *                   •     |
             * [scope update] scope->smtg = 'data'
             *                   |     |
             *                   •     |
             * [html attribute update] <... smtg="'data'">
             *                   |     |
             *                   •     |
             * [html attribute watch] scope.$watch($parse($attrs.smtg), function(data) { ctrl->setSmtg(data) });
             * 
             *
             * _cancelCyclicCall is used to fix revoke the infinite loop before it happens.
             * When true, the HTML attribute watch is ignored. The variable is then automaticaly set back to false
             * so the behavior doesn't persist.
             *
             * An alternative solution would be to do the code logic within $watches instead of within the directive controller's
             * methods (which is currently considered as a viewmodel) and only use the directive's controller to change the scope
             * attributes. No _cancelCyclicCall variable would be required that way but it requires to create an additional (meaningless)
             * abstraction layer.
             * 
             * @type {Boolean}
             */
            var _cancelCyclicCall = false;

            // Provide access to the viewport controller through the seriesId
            ctrls.vpSeriesId.getViewport = function() {
                return viewportController.getModel();
            };

            // bind view model -> viewport controller
            viewmodel.onCurrentImageIdChanged(function(imageId, isNewSeries, setShownImageCallback) {
                // Change displayed image when series' current image changes
                if (imageId) {
                    viewportController
                        .setImage(imageId)
                        .then(function() {
                            if (setShownImageCallback) {
                                setShownImageCallback(imageId);
                            }
                        });

                    // wv-image-index
                    if (wvImageIndexParser && wvImageIndexParser.assign) {
                        var series = viewmodel.getSeries();
                        if (series) { // assert(!!series)
                            _cancelCyclicCall = wvImageIndexParser(scope) !== series.currentIndex;
                            wvImageIndexParser.assign(scope, series.currentIndex);
                        }
                    }
                }
                else {
                    viewportController.clearImage();
                    // wv-image-index
                    if (wvImageIndexParser && wvImageIndexParser.assign) {
                        _cancelCyclicCall = wvImageIndexParser(scope) !== 0;
                        wvImageIndexParser.assign(scope, 0);
                    }
                }
            });

            // bind attributes -> view model
            // vp-series-id
            var vpSeriesIdParser = $parse(attrs.vpSeriesId);
            scope.$watch(vpSeriesIdParser, function(id) {
                if (!id) {
                    viewmodel.clearSeries();
                }
                else {
                    // Keep the defined series' image index. This is required
                    // for services such as liveshare. It is not the `wvSeriesId`
                    // responsibility to set the new image id, but the 
                    // `wvSeriesId`'s user.
                    var imageIndex = wvImageIndexParser(scope) || 0;

                    // Set the new series
                    viewmodel.setSeries(id, imageIndex);
                }
            });

            // wv-image-index
            scope.$watch(wvImageIndexParser, function(index) {
                if (_cancelCyclicCall) {
                    _cancelCyclicCall = false;
                    return;
                }

                // Set the image of the current series
                var series = viewmodel.getSeries();
                if (series) {
                    series.goToImage(+index);
                }
            });

            // bind view model -> attributes
            var vpOnSeriesChangeParser = $parse(attrs.vpOnSeriesChange);
            var wvSeriesParser = $parse(attrs.wvSeries);
            viewmodel.onSeriesChanged(function(series) {
                // wv-series
                if (wvSeriesParser && wvSeriesParser.assign) {
                    wvSeriesParser.assign(scope, series);
                }
                // vp-on-series-change
                if (vpOnSeriesChangeParser) {
                    vpOnSeriesChangeParser(scope, {$series: series});
                }
                // vp-series-id
                if (vpSeriesIdParser && vpSeriesIdParser.assign) {
                    vpSeriesIdParser.assign(scope, series && series.id);
                }
            });

            // bind view model -> extensions -> model
            // Series-related tools
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

        /**
         * @type {osimis.Listener}
         * 
         * @description
         * Callback used to update Angular databound HTML attributes (&
         * events).
         */
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

                // Trigger `currentImageIdChanged` event.
                var imageIdInSeries = newSeries.getCurrentImageId();
                _this.onCurrentImageIdChanged.trigger(imageIdInSeries, true);
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

    SeriesViewModel.prototype.setSeries = function(id, imageIndex) {
        var _this = this;

        this._seriesId = id;

        // Set the default `imageIndex` to the first image of the series.
        imageIndex = imageIndex || 0;

        var oldSeries = _this._series;
        this._series = null; // Make sure getSeries returns null during the loading of the new one.

        // Load series model
        return this._seriesManager
            .get(id)
            .then(function(series) {
                _this._series = series;

                // Go to the defined imageIndex
                series.goToImage(imageIndex);

                // Trigger `onSeriesChanged` event
                _this.onSeriesChanged.trigger(series, oldSeries);

                return series;
            });
    };

    SeriesViewModel.prototype.getSeries = function() {
        return this._series;
    };

})();
