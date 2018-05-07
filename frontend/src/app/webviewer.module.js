(function(osimis) {
    'use strict';

    /**
     * @ngdoc object
     *
     * @name osimis
     *
     * @description
     * The POJO Web Viewer's module/package.
     */
    // this.osimis = this.osimis || {}; // as `this` is undefined it equals to
                                        // `window` or `self` depending on the
                                        // context

    /**
     * @ngdoc overview
     *
     * @name webviewer
     *
     * @description
     * The AngularJS Web Viewer's module/package.
     */
    angular
    .module('webviewer', ['webviewer.layout', 'webviewer.toolbox', 'webviewer.translation', 'ngCookies', 'ngResource', 'ngSanitize', 'mgcrea.ngStrap', 'ngRangeFilter', 'debounce'])
    .config(function($locationProvider, $compileProvider) {
        // Warning: Web Viewer is uncompatible with <base> HTML element (due to SVG/XLink issue)! Don't use it!
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });

        // Fix AngularJS 1.6 breaking change https://github.com/angular/angular.js/blob/master/CHANGELOG.md
        if ($compileProvider.preAssignBindingsEnabled) {
            $compileProvider.preAssignBindingsEnabled(true);
        }
    })
    // Configure with HttpRequest at init
    .run(function($q) {
        // Use HttpRequest with $q as the promise library
        // @note This breaks usage of HttpRequest outside the angular scope (because $q requires
        //       $digest cycles). That situation is very unlikelety to happen thought. The previous
        //       statement doesn't apply in the case of workers which have an external context.
        osimis.HttpRequest.Promise = $q;

        osimis.HttpRequest.timeout = 0; // No timeout
    })
    .constant('$', window.$)
    .constant('_', window._)
    .constant('pako', window.pako)
    .constant('JpegImage', window.JpegImage)
    .constant('hamster', window.Hamster)
    .constant('cornerstone', window.cornerstone)
    .constant('cornerstoneTools', window.cornerstoneTools)
    .constant('uaParser', new UAParser())
    ;

})(this.osimis || (this.osimis = {}));
