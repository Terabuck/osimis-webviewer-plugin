(function() {
    'use strict';

    angular
        .module('webviewer')
        .run(runLoader);

    /* @ngInject */
    function runLoader(cornerstone, wvImage) {
        cornerstone.registerImageLoader('orthanc', function(id) {
            id = id.replace('orthanc://', '');
            return wvImage.get(id)
                .then(function(image) {
                    return image.getPixelObject();
                });
        });
    }

})();
