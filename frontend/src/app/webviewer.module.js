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
    .constant('$', window.$)
    .constant('_', window._)
    .constant('pako', window.pako)
    .constant('JpegImage', window.JpegImage)
    .constant('hamster', window.Hamster)
    .constant('cornerstone', window.cornerstone)
    .constant('cornerstoneTools', window.cornerstoneTools)
    ;

})();
