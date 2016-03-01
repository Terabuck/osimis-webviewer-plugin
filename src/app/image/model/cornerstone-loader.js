(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('wvCornerstoneLoader', wvCornerstoneLoader)
        .run(runLoader);

    /* @ngInject */
    function runLoader(cornerstone, wvCornerstoneLoader) {
        cornerstone.registerImageLoader('orthanc', function(id) {
            id = id.replace('orthanc://', '');
            return wvCornerstoneLoader.getCompressedImage(id);
        });
    }

    /* @ngInject */
    function wvCornerstoneLoader(_, pako, JpegImage, cornerstone, wvImage) {

        // @todo refactor into image repository
        // and create a factory instead

        var service = {
            /* @warning @note @todo
             *
             * this instruction caches every pixels.
             * It is only usable in prototypal context.
             */
            getCompressedImage: _.memoize(getCompressedImage)
        };

        //////////

        return service;

        //////////

        function getCompressedImage(id) {
            return wvImage
                .getCompressedImage(id)
                .then(function(image) {
                    image.imageId = id;

                    if (image.color) {
                        image.render = cornerstone.renderColorImage;
                    }
                    else {
                        image.render = cornerstone.renderGrayscaleImage;
                    }

                    /* @warning @note @todo
                     *
                     * getPixelData is called by cornerstone
                     *
                     * this instruction caches every pixels.
                     * It is only usable in prototypal context.
                     */
                    image.getPixelData = _.memoize(_getPixelData);

                    return image;
                });
        }

    }

    function _changeDynamics(pixels, source1, target1, source2, target2) {
        var scale = (target2 - target1) / (source2 - source1);
        var offset = (target1) - scale * source1;

        for (var i = 0, length = pixels.length; i < length; i++) {
            pixels[i] = scale * pixels[i] + offset;
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

    function _getPixelData() {
        switch (this.Orthanc.Compression) {
          case 'Deflate':
            return _getPixelDataDeflate(this);
          case 'Jpeg':
            return _getPixelDataJpeg(this);
          default:
            throw new Error('unknown compression');
        }
    }

    function _getPixelDataDeflate(image) {
        // Decompresses the base64 buffer that was compressed with Deflate
        var s = pako.inflate(window.atob(image.Orthanc.PixelData));
        var pixels = null;
        var buf, index, i;

        if (image.color) {
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

    function _getPixelDataJpeg(image) {
        var jpegReader = new JpegImage();
        var jpeg = _str2ab(window.atob(image.Orthanc.PixelData));
        jpegReader.parse(jpeg);
        var s = jpegReader.getData(image.width, image.height);
        var pixels = null;
        var buf, index, i;

        if (image.color) {
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
            buf = new ArrayBuffer(s.length * 2); // uint8_t
            pixels = new Int16Array(buf);
            index = 0;
            for (i = 0; i < s.length; i++) {
                pixels[index] = s[i];
                index++;
            }

            if (image.Orthanc.Stretched) {
                _changeDynamics(pixels, 0, image.Orthanc.StretchLow, 255, image.Orthanc.StretchHigh);
            }
        }

        return pixels;
    }

})();
