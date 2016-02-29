'use strict';

/**
 * @ngdoc service
 * @name webviewer.orthanc
 * @description
 * # orthanc
 * Service in the webviewer.
 */
angular.module('webviewer')
.factory('orthancApiService', ['$resource', '$cacheFactory', 'wvConfig',
function($resource, $cacheFactory, wvConfig) { // refactor to wvApiService
    var cache = $cacheFactory('osimis-webviewer');

    return {
      serie: $resource(wvConfig.orthancApiURL + '/series/:id', {
        id: '@id'
      }, {
        get: { method: 'GET', cache: cache },
        // ordered instances
        listInstances: { method: 'GET', url: wvConfig.orthancApiURL + '/series/:id/ordered-slices', cache: cache }
      }),
      instance: $resource(wvConfig.webviewerApiURL + '/instances/:compression-:id:frame', { // @todo cache ?
        compression: wvConfig.defaultCompression, 
        id: '@id',
        frame: '_0'
      }, {
        getTags: { method: 'GET', url: wvConfig.orthancApiURL + '/instances/:id/simplified-tags:compression:frame', cache: cache, params: {id:'@id', frame:'', compression:''} },
        getImage: { method: 'GET', url: wvConfig.webviewerApiURL + '/instances/:compression-:id:frame' }
      }),
      study: $resource(wvConfig.orthancApiURL + '/studies/:id', {
        id: '@id'
      })
    };

}]);
