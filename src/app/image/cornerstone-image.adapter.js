(function() {
    
    /**
     * vwCornerstoneImageAdapter
     *
     * Converts an orthanc pixel object into a cornerstone pixel object
     */

    'use strict';

    angular
        .module('webviewer')
        .factory('wvCornerstoneImageAdapter', wvCornerstoneImageAdapter);

    /* @ngInject */
    function wvCornerstoneImageAdapter(wvConfig, cornerstone) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(imageId, metaData, pixelArray) {
            // @todo check if this variable is required, remove it if not, write why otherwise
            metaData.imageId = imageId;

            if (metaData.color) {
                metaData.render = cornerstone.renderColorImage;
            }
            else {
                metaData.render = cornerstone.renderGrayscaleImage;
            }

            metaData.getPixelData = function() {
                return pixelArray;
            };
            
            return metaData;
        }
    }
})();