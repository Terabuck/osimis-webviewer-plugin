(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImageRepository', wvImageRepository);

    /* @ngInject */
    function wvImageRepository($http, $q, wvConfig, orthancApiService, wvImageModel) {
        var service = {
            get: get,
            getCompressedImage: getCompressedImage
        };
        return service;

        ////////////////
        
        function get(id) {
            var splittedId = id.split(':');
            var orthancId = splittedId[0];
            var frameIndex = splittedId[1] || 0;

            var tags = orthancApiService
                .instance
                .getTags({id: orthancId})
				.$promise;
            
			return $q
			    .all({
			      tags: tags,
			    })
				.then(function(args) {
				    var tags = args.tags;
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
                .then(function(result) {
                    return result.data;
                });
        }

    }
})();
