'use strict';

/**
 * @ngdoc service
 * @name webviewer.orthanc
 * @description
 * # orthanc
 * Service in the webviewer.
 */
angular.module('webviewer')
.factory('orthancApiService', ['$resource', '$cacheFactory', function($resource, $cacheFactory) {
    var _orthancApiUri = 'http://localhost:8042';
    var _webViewerApiUri = 'http://localhost:8042/web-viewer';
    var _compression = 'jpeg95';
  
    var cache = $cacheFactory('orthanc');

    return {
      serie: $resource(_orthancApiUri + '/series/:id', {
        id: '@id'
      }, {
        get: { method: 'GET', cache: cache },
        // ordered instances
        listInstances: { method: 'GET', url: _orthancApiUri + '/series/:id/ordered-slices', cache: cache }
      }),
      instance: $resource(_orthancApiUri + '/instances/:compression-:id', { // @todo cache ?
        compression: 'jpeg95', 
        id: '@id'
      }, {
        getTags: { method: 'GET', url: _orthancApiUri + '/instances/:id/simplified-tags', cache: cache }
      }),
      study: $resource(_orthancApiUri + '/studies/:id', {
        id: '@id'
      })
    };

}]);
