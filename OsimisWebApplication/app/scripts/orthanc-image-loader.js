(function (cornerstone) {
  'use strict';

  // @todo: refactor
  var compression = 'jpeg95';
  var _orthancApiUri = 'http://localhost:8042';
  var _webViewerApiUri = 'http://localhost:8042/web-viewer';

  function PrintRange(pixels)
  {
    var a = Infinity;
    var b = -Infinity;

    for (var i = 0, length = pixels.length; i < length; i++) {
      if (pixels[i] < a)
        a = pixels[i];
      if (pixels[i] > b)
        b = pixels[i];
    }    

    console.log(a + ' ' + b);
  }

  function ChangeDynamics(pixels, source1, target1, source2, target2)
  {
    var scale = (target2 - target1) / (source2 - source1);
    var offset = (target1) - scale * source1;

    for (var i = 0, length = pixels.length; i < length; i++) {
      pixels[i] = scale * pixels[i] + offset;
    }    
  }


  function getPixelDataDeflate(image) {
    // Decompresses the base64 buffer that was compressed with Deflate
    var s = pako.inflate(window.atob(image.Orthanc.PixelData));
    var pixels = null;

    if (image.color) {
      var buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
      pixels = new Uint8Array(buf);
      var index = 0;
      for (var i = 0, length = s.length; i < length; i += 3) {
        pixels[index++] = s[i];
        pixels[index++] = s[i + 1];
        pixels[index++] = s[i + 2];
        pixels[index++] = 255;  // Alpha channel
      }
    } else {
      var buf = new ArrayBuffer(s.length * 2); // int16_t
      pixels = new Int16Array(buf);
      var index = 0;
      for (var i = 0, length = s.length; i < length; i += 2) {
        var lower = s[i];
        var upper = s[i + 1];
        pixels[index] = lower + upper * 256;
        index++;
      }
    }

    return pixels;
  }


  // http://stackoverflow.com/a/11058858/881731
  function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var pixels = new Uint8Array(buf);
    for (var i = 0, strLen=str.length; i<strLen; i++) {
      pixels[i] = str.charCodeAt(i);
    }
    return pixels;
  }

  function getPixelDataJpeg(image) {
    var jpegReader = new JpegImage();
    var jpeg = str2ab(window.atob(image.Orthanc.PixelData));
    jpegReader.parse(jpeg);
    var s = jpegReader.getData(image.width, image.height);
    var pixels = null;

    if (image.color) {
      var buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
      pixels = new Uint8Array(buf);
      var index = 0;
      for (var i = 0, length = s.length; i < length; i += 3) {
        pixels[index++] = s[i];
        pixels[index++] = s[i + 1];
        pixels[index++] = s[i + 2];
        pixels[index++] = 255;  // Alpha channel
      }
    } else {
      var buf = new ArrayBuffer(s.length * 2); // uint8_t
      pixels = new Int16Array(buf);
      var index = 0;
      for (var i = 0, length = s.length; i < length; i++) {
        pixels[index] = s[i];
        index++;
      }

      if (image.Orthanc.Stretched) {
        ChangeDynamics(pixels, 0, image.Orthanc.StretchLow, 255, image.Orthanc.StretchHigh);
      }
    }

    return pixels;
  }
  

  function getOrthancImage(imageId) {
    var result = null;

    $.ajax({
      type: 'GET',
      url: _webViewerApiUri + '/instances/' + compression + '-' + imageId,
      dataType: 'json',
      cache: true,
      async: false,
      success: function(image) {
        image.imageId = imageId;
        if (image.color)
          image.render = cornerstone.renderColorImage;
        else
          image.render = cornerstone.renderGrayscaleImage;

        // @todo prototype
        image.getPixelData = function() {
          if (image.Orthanc.Compression == 'Deflate')
            return getPixelDataDeflate(this);

          if (image.Orthanc.Compression == 'Jpeg')
            return getPixelDataJpeg(this);

          // Unknown compression
          return null;
        }

        result = image;
      },
      error: function() {
        return null;
      }
    });
    
    var deferred = $.Deferred();
    deferred.resolve(result);
    return deferred;
  }

  // register our imageLoader plugin with cornerstone
  cornerstone.registerImageLoader('', getOrthancImage);

}(cornerstone));