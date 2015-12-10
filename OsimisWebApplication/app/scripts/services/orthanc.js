'use strict';

/**
 * @ngdoc service
 * @name osimiswebviewerApp.orthanc
 * @description
 * # orthanc
 * Service in the osimiswebviewerApp.
 */
angular.module('osimiswebviewerApp')
.factory('orthanc', ['$resource', '$cacheFactory', function($resource, $cacheFactory) {
    var _orthancApiUri = 'http://localhost:8042';
    var _webViewerApiUri = 'http://localhost:8042/web-viewer';
    var _compression = 'jpeg95';
  
    var cache = $cacheFactory('orthanc');

    return {
      serie: $resource(_orthancApiUri + '/series/:id', {
        id: '@id'
      }, {
        get: { method: 'GET', cache: cache},
        // countInstances: { url: _orthancApiUri + '/series/:id', method: 'GET', cache: cache, transformResponse: function(response) {
        //   // @todo optimize
        //   return {
        //     InstanceCount: angular.fromJson(response).Instances.length
        //   };
        // }}
      }),
      instance: $resource(_orthancApiUri + '/instances/:compression-:id', {
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
