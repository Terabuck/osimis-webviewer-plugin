(function() {
    'use strict';

    /**
     * @ngdoc overview
     * @name osimiswebviewerApp
     * @description
     * # osimiswebviewerApp
     *
     * Main module of the application.
     */
    angular
    .module('webviewer', ['ngResource', 'ngSanitize', 'mgcrea.ngStrap', 'ngRangeFilter', 'debounce'])
    .config(function($locationProvider) {
        // Warning: Web Viewer is uncompatible with <base> HTML element (due to SVG/XLink issue)! Don't use it!
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
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

})();
