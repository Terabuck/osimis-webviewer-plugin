/** 
 * @ngdoc service
 * 
 * @name webviewer.WvHttpRequest
 * 
 * @description
 * Wrapper over osimis.HttpRequest class. See the `http-request.class.js` file for more information. It also inject the $q
 * dependency in HttpRequest class.
 */
(function() {
    'use strict';

    angular
        .module('webviewer')
        .service('WvHttpRequest', WvHttpRequest);

    /* @ngInject */
    function WvHttpRequest($q) {
        // Use HttpReqest with $q as the promise library
        // @note This breaks usage of HttpRequest outside the angular scope (because $q requires
        //       $digest cycles). That situation is very unlikelety to happen thought. The previous
        //       statement doesn't apply in the case of workers which have an external context.
        osimis.HttpRequest.Promise = $q;

        // Return the HttpRequest class
        return osimis.HttpRequest;
    }

})();