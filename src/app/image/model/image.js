(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvImage', wvImage);

    /* @ngInject */
    function wvImage($http, $q, wvConfig, WVImageModel) {
        var service = {
            get: get,
            getCompressedImage: getCompressedImage
        };
    
        // @todo flush somehow
        var modelCache = {};

        // @todo flush somehow
        var pixelCache = {};
        

        return service;

        ////////////////
        
        function get(id) {
            if (!modelCache.hasOwnProperty(id)) {
                var splittedId = id.split(':');
                var instanceId = splittedId[0];
                var frameIndex = splittedId[1] || 0;

                modelCache[id] = $http
                    .get(wvConfig.orthancApiURL + '/instances/'+instanceId+'/simplified-tags')
                    .then(function(response) {
                        var tags = response.data;
                        return new WVImageModel(id, tags);
                    });
            }

            return modelCache[id];
        };

        function getCompressedImage(id) {
            if (!pixelCache.hasOwnProperty(id)) {
                var compression = wvConfig.defaultCompression;
                id = id.split(':');
                var instanceId = id[0];
                var frameIndex = id[1];
                pixelCache[id] = $http
                    .get(wvConfig.webviewerApiURL + '/instances/' +compression+ '-' + instanceId + '_' + frameIndex)
                    .then(function(response) {
                        return response.data;
                    });
            }

            return pixelCache[id];
        }

    }
})();
