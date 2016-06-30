/**
 *
 * Worker that retrieve and process image binaries.
 *
 * Can only process one request at a time.
 * User has to wait request end (or abort it using a command) to send a new one, otherwise it'll bug.
 *
 */

'use strict';

// @todo move jpgjs & pngjs out of bower_components

/* @inline: */ importScripts('/app/image/image-parser.worker/klvreader.class.js');
/* @inline: */ importScripts('/bower_components/jpgjs/jpg.js');

// Make png.js & config.js worker compatible
var document = {
    createElement: function() { return { getContext: function() {} } }
};
var window = {};

// Import png.js
/* @inline: */ importScripts('/bower_components/png.js/zlib.js');
/* @inline: */ importScripts('/bower_components/png.js/png.js');

var PNG = window.PNG;
var KLVReader = WorkerGlobalScope.KLVReader;

// dirty FIX PhantomJS for unit tests
if (!location || !location.origin) {
    var location = {
        origin: 'http://localhost:9876'
    };
}

var ImageApiURL = undefined;
function setImageApiUrl(rootUrl) {
    // Import config.js for window.orthancUrl
    importScripts(rootUrl + '/config.js');
    var orthancUrl = window.orthancUrl;
    
    // Check the path is absolute
    // (because workers are built to blob strings, their' location is not relative to the js main thread one.)
    if (orthancUrl.indexOf('://') === -1 && orthancUrl.indexOf('/') !== 0) {
        throw new Error('config.js should have absolute path');
    }

    // Prefix path with http://server:port (to wrong protocole issue due to blob url resolving to blob://server:port)
    if (orthancUrl.indexOf('://') === -1) {
        orthancUrl = location.origin + orthancUrl;
    }

    // Remove trailing slash
    if (orthancUrl.lastIndexOf('/') === orthancUrl.length - 1) {
        orthancUrl = orthancUrl.slice(0, -1);
    }

    // Set the route
    ImageApiURL = orthancUrl + '/osimis-viewer/images/';
}

// @todo out..
var Qualities = {
    // 0 is reserved as none..
    LOSSLESS: 100,
    LOW: 1, // resampling to 150 px + compressed to jpeg100
    MEDIUM: 2 // resampling to 1000 px + compressed to jpeg100
};

self.addEventListener('message', function(evt) {
    var type = evt.data.type;

    switch(type) {
    case 'setRootUrl':
        // Configure the ImageApiURl
        var rootUrl = evt.data.url;

        setImageApiUrl(rootUrl);
        break;
    case 'getBinary':
        // Get an image binary
        var id = evt.data.id;
        var quality = evt.data.quality;

        getCommand(id, quality);
        break;
    case 'abort':
        // Abort a getCommand.
        // Do not reply anything, the reply is sent by the aborted getCommand.

        abortCommand();
        break;
    default:
        throw new Error('Unknown command');
    };
}, false);

var _processingRequest = null;

function abortCommand() {
    if (!_processingRequest) {
        // There is no reliable way to know from the main thread task has already been processed
        // so we just do nothing when it's the case
        return;
    }

    // Abort request (& answer via BinaryRequest failure - not sure its crossbrowser compatible)
    _processingRequest.abort();
}

function getCommand(id, quality) {
    if (_processingRequest) {
        throw new Error('Another request is already in process within worker thread.');
    }

    // Execute request
    _processingRequest = new BinaryRequest(id, quality);
    _processingRequest.execute();
}

function BinaryRequest(id, quality) {
    this.id = id;
    this.quality = quality;

    // Parse url
    var splittedId = id.split(':');
    var instanceId = splittedId[0];
    var frameIndex = splittedId[1] || 0;
    
    var url = null;
    switch (quality) {
    case Qualities.LOSSLESS:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/high-quality';
        break;
    case Qualities.MEDIUM:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/medium-quality';
        break;
    case Qualities.LOW:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/low-quality';
        break;
    default:
        _processingRequest = null; // cleaning request
        throw new Error('Undefined quality: ' + quality);
    }

    // Create request
    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', encodeURI(url), true); // async xhr request because we wan't to be able to abort the request
    this.xhr.responseType = 'arraybuffer';
}
BinaryRequest.prototype.execute = function() {
    var xhr = this.xhr;
    var quality = this.quality;

    xhr.onreadystatechange = function() {
        // Only check finished requests
        if (xhr.readyState !== XMLHttpRequest.DONE) {
            return;
        }

        if (xhr.status === 200) {
            try {
                // process binary out of the klv
                var arraybuffer = xhr.response;
                var data = parseKLV(arraybuffer);

                if (data.decompression.compression === 'Jpeg') {
                    // Decompress lossy jpeg into 16bit
                    var pixelArray = parseJpeg(data.decompression);
                    pixelArray = convertBackTo16bit(pixelArray, data.decompression);
                }
                else if (data.decompression.compression === 'Png') {
                    // Decompress lossless png
                    var pixelArray = parsePng(data.decompression)
                }
            }
            catch (e) {
                _processingRequest = null; // cleaning request
                throw e;
            }

            // stock the format of the array, and return the array's buffer
            // with its format instead of the array itself (array can't be worker transferable object but buffer can)
            var pixelBufferFormat = null;
            if (pixelArray instanceof Uint8Array) {
                pixelBufferFormat = 'Uint8';
            }
            else if (pixelArray instanceof Int8Array) {
                pixelBufferFormat = 'Int8';
            }
            else if (pixelArray instanceof Uint16Array) {
                pixelBufferFormat = 'Uint16';
            }
            else if (pixelArray instanceof Int16Array) {
                pixelBufferFormat = 'Int16';
            }
            else {
                _processingRequest = null; // cleaning request
                throw new Error("Unexpected array binary format");
            }

            // answer request to the main thread
            self.postMessage({
                type: 'success',
                cornerstoneMetaData: data.cornerstone,
                pixelBuffer: pixelArray.buffer,
                pixelBufferFormat: pixelBufferFormat
            }, [pixelArray.buffer]); // pixelArray is transferable
        }
        else {
            // May be called by abort (@todo not sure this behavior is crossbrowser compatible)

            self.postMessage({
                type: 'failure',
                status: xhr.status
            });
        }

        // Clean the processing request when it's done
        _processingRequest = null;
    };

    xhr.send(); // async call
};

BinaryRequest.prototype.abort = function() {
    // Abort the http request
    this.xhr.abort();

    // The jpeg decompression can't be aborted (requires setTimeout loop during decompression to allow a function to stop it asynchronously during the event loop)
    // Png decompression is done it two times so it could potentially be stopped at half.
};

function parseKLV(arraybuffer) {
    var klvReader = new KLVReader(arraybuffer);
    var keys = {
        // - Cornerstone related
        Color: 0,
        Height: 1,
        Width: 2,
        SizeInBytes: 3, // size in raw prior to compression

        // Pixel size / aspect ratio
        ColumnPixelSpacing: 4,
        RowPixelSpacing: 5,

        // LUT
        MinPixelValue: 6,
        MaxPixelValue: 7,
        Slope: 8,
        Intercept: 9,
        WindowCenter: 10,
        WindowWidth: 11,


        // - WebViewer related
        IsSigned: 12,
        Stretched: 13, // set back 8bit to 16bit if true
        Compression: 14,

        // used to zoom downsampled images back to original size
        // cornerstone doesn't support this natively, it's done in the viewport
        OriginalHeight: 15, 
        OriginalWidth: 16,

        // - Image binary
        ImageBinary: 17
    };

    var cornerstoneMetaData = {
        color: klvReader.getUInt(keys.Color),
        height: klvReader.getUInt(keys.Height),
        width: klvReader.getUInt(keys.Width),
        rows: klvReader.getUInt(keys.Height),
        columns: klvReader.getUInt(keys.Width),
        sizeInBytes: klvReader.getUInt(keys.SizeInBytes),

        columnPixelSpacing: klvReader.getFloat(keys.ColumnPixelSpacing),
        rowPixelSpacing: klvReader.getFloat(keys.RowPixelSpacing),

        minPixelValue: klvReader.getInt(keys.MinPixelValue),
        maxPixelValue: klvReader.getInt(keys.MaxPixelValue),
        slope: klvReader.getFloat(keys.Slope),
        intercept: klvReader.getFloat(keys.Intercept),
        windowCenter: klvReader.getFloat(keys.WindowCenter),
        windowWidth: klvReader.getFloat(keys.WindowWidth),

        originalHeight: klvReader.getUInt(keys.OriginalHeight),
        originalWidth: klvReader.getUInt(keys.OriginalWidth)
    };

    var compression = klvReader.getString(keys.Compression);
    if (compression !== 'Jpeg' && compression !== 'Png') {
        _processingRequest = null; // cleaning request
        throw new Error('unknown compression');
    }

    var decompressionMetaData = {
        binary: klvReader.getBinary(keys.ImageBinary),
        compression: compression,
        width: cornerstoneMetaData.width,
        height: cornerstoneMetaData.height,
        hasColor: cornerstoneMetaData.color,
        isSigned: klvReader.getUInt(keys.IsSigned),
        stretching: !klvReader.getUInt(keys.Stretched) ? null : {
            low: cornerstoneMetaData.minPixelValue,
            high: cornerstoneMetaData.maxPixelValue
        }
    }

    return {
        cornerstone: cornerstoneMetaData,
        decompression: decompressionMetaData
    };
}

// if hasColor
//  -> Uint32 == Uint8 * 4 (RGBA)
// 
// if !hasColor && IsSigned
//  -> Int16
// 
// if !hasColor && !IsSigned
//  -> Uint16
// 
function parseJpeg(config) {
    var jpegReader = new JpegImage();
    jpegReader.parse(config.binary);
    var s = jpegReader.getData(config.width, config.height);
    return s;
}

function parsePng(config) {
    var pixels = null;
    var buf, index, i;

    var png = new PNG(config.binary);

    var s = png.decodePixels(); // returns Uint8 array

    var bytePerPixel = png.bits;
    
    if (config.hasColor) {
        // Convert png24 to rgb32

        buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
        pixels = new Uint8Array(buf); // RGB24
        index = 0;
        for (i = 0; i < s.length; i += 3) {
            pixels[index++] = s[i];
            pixels[index++] = s[i + 1];
            pixels[index++] = s[i + 2];
            pixels[index++] = 255;  // Alpha channel
        }
    } else if (png.bits === 16) {
        // Cast uint8_t array to (u)int16_t array
        
        pixels = _convertPngEndianness(s, config);

    }
    else if (png.bits === 8 && config.isSigned) {
        pixels = new Int8Array(s.buffer);
    }
    else if (png.bits === 8 && !config.isSigned) {
        pixels = new Uint8Array(s.buffer);
    }
    else {
        _processingRequest = null; // cleaning request
        throw new Error('unexpected png format');
    }

    return pixels;
}
// Raw is big endian..
function _convertPngEndianness(s, config) {
    var pixels, buf, index, i, lower, upper;

    buf = new ArrayBuffer(s.length * 2); // uint16_t or int16_t
    if (config.isSigned) {
        // pixels = new Int16Array(buf);
        pixels = new Int16Array(s.buffer);
    } else {
        // pixels = new Uint16Array(buf);
        pixels = new Uint16Array(s.buffer);
    }

    index = 0;
    for (i = 0; i < s.length; i += 2) {
        // PNG is little endian
        upper = s[i];
        lower = s[i + 1];
        pixels[index] = lower + upper * 256;
        index++;
    }

    return pixels;
}

function convertBackTo16bit(s, config) {
    var pixels = null;
    var buf, index, i;

    if (config.hasColor) {
        buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
        pixels = new Uint8Array(buf); // RGB24
        index = 0;
        for (i = 0; i < s.length; i += 3) {
            pixels[index++] = s[i];
            pixels[index++] = s[i + 1];
            pixels[index++] = s[i + 2];
            pixels[index++] = 255;  // Alpha channel
        }
    } else {
        buf = new ArrayBuffer(s.length * 2); // uint16_t or int16_t
        if (config.isSigned) {
            pixels = new Int16Array(buf);
        } else {
            pixels = new Uint16Array(buf);
        }

        index = 0;
        for (i = 0; i < s.length; i++) {
            pixels[index] = s[i];
            index++;
        }

        if (config.stretching) {
            _changeDynamics(pixels, 0, config.stretching.low, 255, config.stretching.high);
        }
    }

    return pixels;
}

function _changeDynamics(pixels, source1, target1, source2, target2) {
    var scale = (target2 - target1) / (source2 - source1);
    var offset = (target1) - scale * source1;

    for (var i = 0, length = pixels.length; i < length; i++) {
        pixels[i] = scale * pixels[i] + offset;
    }    
}
