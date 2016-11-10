/**
 * The `wvMobileCompatibility` service centralize mobile-related fixes.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvMobileCompatibility', wvMobileCompatibility);

    /* @ngInject */
    function wvMobileCompatibility(uaParser) {
        // Hide scrollbar on iphone.
        // See http://stackoverflow.com/questions/6011223/how-to-completely-hide-the-navigation-bar-in-iphone-html5
        // @warning this may have undesired behavior on projects embedding webviewer without iframe.
        if (/mobile/i.test(navigator.userAgent)) {
            window.scrollTo(0, 1);
        }

        // Provide general config
        var service = {
            toolbarEnabled: uaParser.getDevice().type !== 'mobile'
        };

        return service;
    }
})();
