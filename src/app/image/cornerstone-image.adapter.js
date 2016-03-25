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
    function wvCornerstoneImageAdapter($http, wvConfig, cornerstone) {
        var service = {
            process: process
        };
        return service;

        ////////////////

        function process(imageId, orthancPixelObject) {
            var pixelObject = orthancPixelObject;

            // @todo check if this variable is required, remove it if not, write why otherwise
            pixelObject.imageId = imageId;

            if (pixelObject.color) {
                pixelObject.render = cornerstone.renderColorImage;
            }
            else {
                pixelObject.render = cornerstone.renderGrayscaleImage;
            }

            // load the pixels out of the getPixelData to avoid lazy loading
            // because loading control should never be handled by an adapter
            var _pixels = _getPixels(pixelObject);
            pixelObject.getPixelData = function() {
                return _pixels;
            };
            
            return pixelObject;
        }
    }


    function _changeDynamics(pixels, source1, target1, source2, target2) {
        var scale = (target2 - target1) / (source2 - source1);
        var offset = (target1) - scale * source1;

        for (var i = 0, length = pixels.length; i < length; i++) {
            pixels[i] = scale * pixels[i] + offset;
        }    
    }

    function _getPixels(pixelObject) {
        switch (pixelObject.Orthanc.Compression) {
          case 'Deflate':
            return _getPixelDataDeflate(pixelObject);
          case 'Jpeg':
            return _getPixelDataJpeg(pixelObject);
          default:
            throw new Error('unknown compression');
        }
    }

    // http://stackoverflow.com/a/11058858/881731
    function _str2ab(str) {
        var buf = new ArrayBuffer(str.length);
        var pixels = new Uint8Array(buf);
        for (var i = 0, strLen=str.length; i<strLen; i++) {
            pixels[i] = str.charCodeAt(i);
        }
        return pixels;
    }

    function _getPixelDataDeflate(pixelObject) {
        // Decompresses the base64 buffer that was compressed with Deflate
        var s = pako.inflate(window.atob(pixelObject.Orthanc.PixelData));
        var pixels = null;
        var buf, index, i;

        if (pixelObject.color) {
            buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
            pixels = new Uint8Array(buf);
            index = 0;
            for (i = 0; i < s.length; i += 3) {
                pixels[index++] = s[i];
                pixels[index++] = s[i + 1];
                pixels[index++] = s[i + 2];
                pixels[index++] = 255;  // Alpha channel
            }
        } else {
            buf = new ArrayBuffer(s.length * 2); // int16_t
            pixels = new Int16Array(buf);
            index = 0;
            for (i = 0; i < s.length; i += 2) {
                var lower = s[i];
                var upper = s[i + 1];
                pixels[index] = lower + upper * 256;
                index++;
            }
        }

        return pixels;
    }

    function _getPixelDataJpeg(pixelObject) {
        var jpegReader = new JpegImage();
        var jpeg = _str2ab(window.atob(pixelObject.Orthanc.PixelData));
        jpegReader.parse(jpeg);
        var s = jpegReader.getData(pixelObject.width, pixelObject.height);
        var pixels = null;
        var buf, index, i;

        if (pixelObject.color) {
            buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
            pixels = new Uint8ClampedArray(buf);
            index = 0;
            for (i = 0; i < s.length; i += 3) {
                pixels[index++] = s[i];
                pixels[index++] = s[i + 1];
                pixels[index++] = s[i + 2];
                pixels[index++] = 255;  // Alpha channel
            }
        } else {
            buf = new ArrayBuffer(s.length * 2); // uint8_t
            pixels = new Int16Array(buf);
            index = 0;
            for (i = 0; i < s.length; i++) {
                pixels[index] = s[i];
                index++;
            }

            if (pixelObject.Orthanc.Stretched) {
                _changeDynamics(pixels, 0, pixelObject.Orthanc.StretchLow, 255, pixelObject.Orthanc.StretchHigh);
            }
        }

        return pixels;
    }
})();