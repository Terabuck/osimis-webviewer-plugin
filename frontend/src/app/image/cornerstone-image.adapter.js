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

        function process(imageId, qualityLevel, metaData, pixelBuffer, pixelBufferFormat) {
            // @todo check if this variable is required, remove it if not, write why otherwise
            metaData.imageId = imageId;
            metaData.qualityLevel = qualityLevel;
            
            var resamplingScale = metaData.width / metaData.originalWidth;
            metaData.columnPixelSpacing = metaData.columnPixelSpacing / resamplingScale;
            metaData.rowPixelSpacing = metaData.rowPixelSpacing / resamplingScale;

            if (metaData.color) {
                metaData.render = cornerstone.renderColorImage;
            }
            else {
                metaData.render = cornerstone.renderGrayscaleImage;
            }
            
            // wrap back buffer into an array
            // create pixelArray out of getPixelData for caching
            var pixelArray = null
            switch (pixelBufferFormat) {
            case 'Uint8':
                pixelArray = new Uint8Array(pixelBuffer);
                break;
            case 'Int8':
                pixelArray = new Int8Array(pixelBuffer);
                break;
            case 'Uint16':
                pixelArray = new Uint16Array(pixelBuffer);
                break;
            case 'Int16':
                pixelArray = new Int16Array(pixelBuffer);
                break;
            default:
                throw new Error("Unexpected array binary format");
            }
            metaData.getPixelData = function() {
                return pixelArray;
            };
            
            return metaData;
        }

    }
})();