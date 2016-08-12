/**
 * @ngdoc directive
 * @name wvTimeline
 *
 * @description
 * The `wvTimeline` high-level directive displays a timeline relative to a shown series.
 *
 * It provides a loading bar (see the `wvLoadingBar` directive):
 * Every series' images are represented on the timeline. The user can clicked upon one of them to 
 * select it. The displayed images also provide the actual status of the download: 
 *   * `grey` - The image has not been downloaded at all
 *   * `red` - The image thumbnail has been downloaded
 *   * `orange` - The low-quality version of the image has been downloaded
 *   * `green` - The lossless-quality version of the image has been downloaded
 *               Note the green quality does not always mean the image is lossless:
 *               an image saved in the PACS as compressed appears green even, since the best quality
 *               available has been provided.
 *
 * Additional controls are also provided (see the `wvTimelineControls` directive):
 *   * The previous and next buttons allow the user to switch image by image.
 *   * An input field let the user specify the image index directly.
 *   * A play button let the user play the series and _configure a specific framerate_.
 *
 * This directive shall be used with the `wvViewport` directive extended by `wvSeriesId`.
 *
 * @compatibility Do not use html <base> tag! cf. http://www.chriskrycho.com/2015/html5-location-base-and-svg.html#fn1
 *                Check the `wvLoadingBar` directive source code for more information.
 *
 * @scope
 *
 * @restrict E
 *
 * @param {series_model} wvSeries (required) The model of the series, as provided by the `wvSeriesId` directive.
 *
 * @example Display a series viewport with the timeline
 * ```html
 * <wv-viewport wv-series-id="'your-series-id'" wv-series="$series" wv-size="{width: '100px', height: '100px'}">
 * </wv-viewport>
 * <wv-timeline wv-series="$series"></wv-timeline>
 * ```
 **/
(function() {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvTimeline', wvTimeline);

    /* @ngInject */
    function wvTimeline() {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                series: '=wvSeries'
            },
            templateUrl: 'app/timeline/timeline.directive.html'
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();