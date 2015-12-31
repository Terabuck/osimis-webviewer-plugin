'use strict';

/**
 * @ngdoc service
 * @name webviewer.orthanc
 * @description
 * # orthanc
 * Service in the webviewer.
 */
angular.module('webviewer')
.factory('orthancApiService', ['$resource', '$cacheFactory', 'wvConfig', function($resource, $cacheFactory, wvConfig) { // refactor to wvApiService
    var cache = $cacheFactory('osimis-webviewer');

    return {
      serie: $resource(wvConfig.orthancApiURL + '/series/:id', {
        id: '@id'
      }, {
        get: { method: 'GET', cache: cache },
        // ordered instances
        listInstances: { method: 'GET', url: wvConfig.orthancApiURL + '/series/:id/ordered-slices', cache: cache }
      }),
      instance: $resource(wvConfig.orthancApiURL + '/instances/:compression-:id', { // @todo cache ?
        compression: wvConfig.defaultCompression, 
        id: '@id'
      }, {
        getTags: { method: 'GET', url: wvConfig.orthancApiURL + '/instances/:id/simplified-tags', cache: cache },
        getImage: { method: 'GET', url: wvConfig.webviewerApiURL + '/instances/:compression-:id'}
      }),
      study: $resource(wvConfig.orthancApiURL + '/studies/:id', {
        id: '@id'
      })
    };

}]);
