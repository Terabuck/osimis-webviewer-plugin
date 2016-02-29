(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageRepository', wvImageRepository);

    /* @ngInject */
    function wvImageRepository($http, $q, wvConfig, wvImageModel) {
        var service = {
            get: get,
            getCompressedImage: getCompressedImage
        };
        return service;

        ////////////////
        
        function get(id) {
            var splittedId = id.split(':');
            var instanceId = splittedId[0];
            var frameIndex = splittedId[1] || 0;
            
			return $http
                .get(wvConfig.orthancApiURL + '/instances/'+instanceId+'/simplified-tags')
				.then(function(response) {
				    var tags = response.data;
                    return wvImageModel.create(id, tags);
				});
        };

        function getCompressedImage(id) {
            var compression = wvConfig.defaultCompression;
            id = id.split(':');
            var instanceId = id[0];
            var frameIndex = id[1];
            return $http
                .get(wvConfig.webviewerApiURL + '/instances/' +compression+ '-' + instanceId + '_' + frameIndex)
                .then(function(response) {
                    return response.data;
                });
        }

    }
})();
