'use strict';

/**
 * @ngdoc service
 * @name osimiswebviewerApp.orthanc
 * @description
 * # orthanc
 * Service in the osimiswebviewerApp.
 */
angular.module('osimiswebviewerApp')
.factory('orthanc', ['$resource', function($resource) {
    var _orthancApiUri = 'http://localhost:8042';
    var _webViewerApiUri = 'http://localhost:8042/web-viewer';
    var _compression = 'jpeg95';

    return {
      serie: $resource(_orthancApiUri + '/series/:id', {id: '@id'}),
      instance: $resource(_orthancApiUri + '/instances/:compression-:id', {
        compression: 'jpeg95', 
        id: '@id'
      }, {
        getTags: { method: 'GET', url: _orthancApiUri + '/instances/:id/tags' }
      })
    };

    // function _findSerieById() {
    //   $.ajax({ // @todo use angular ajax
    //     type: 'GET',
    //     url: _orthancApiUri + '/series/' + self.serieId,
    //     dataType: 'json',
    //     cache: false,
    //     async: false,
    //     success: function(volume) {
    //       instances = volume.Instances;
    //       if (volume.Instances.length > self.imageIndex) {
    //         self.imageId = instances[self.imageIndex];
    //       }
    //     }
    //   });
    // }

    function _findImageById() {
      
    }
}]);
