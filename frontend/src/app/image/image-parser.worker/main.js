/**
 *
 * Worker that retrieve and process image binaries.
 *
 * Can only process one request at a time.
 * User has to wait request end (or abort it using a command) to send a new one, otherwise it'll bug.
 *
 * As this is a web worker, we must share any information through messages
 * Therefore, 3 commands can be send from main thread (see the self.addEventListener call):
 * - setOrthancUrl — Configure the Orthanc API Url
 * - getBinary — Get an image binary
 * - abort - Cancel a request
 *
 * Imported scripts must be inlined to avoid path loading issues when used as a library
 *
 */

'use strict';

// @todo move jpgjs & pngjs out of bower_components

// Load libraries

// Import ArrayBuffer polyfill
/* @inline: */ importScripts('/app/image/image-parser.worker/array-buffer.polyfill.js');

// Import user agent parser
/* @inline: */ importScripts('/bower_components/ua-parser-js/dist/ua-parser.min.js');
var uaParser = (new UAParser()).getResult();

// Import bluebird promise polyfill
/* @inline: */ importScripts('/bower_components/bluebird/js/browser/bluebird.min.js');

// Import osimis.HttpRequest
/* @inline: */ importScripts('/app/utilities/http-request.class.js');

// Import KLVReader
/* @inline: */ importScripts('/app/image/image-parser.worker/klvreader.class.js');

// Import jpeg lib
/* @inline: */ importScripts('/bower_components/jpgjs/jpg.js');

// Import jpeg FFC3 lib
/* @inline: */ importScripts('/bower_components/jpeg-lossless-decoder-js/release/current/lossless-min.js');

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


/** setImageApiUrl(locationUrl, orthancApiUrl)
 *
 * Configure the Orthanc API Url
 *
 **/
var OrthancApiURL = undefined;
var ImageApiURL = undefined;
function setImageApiUrl(orthancApiUrl) {
    // Set the route
    OrthancApiURL = orthancApiUrl;
    ImageApiURL = orthancApiUrl + '/osimis-viewer/images/';
}

// @todo out..
var Qualities = {
    // 0 is reserved as none..
    PIXELDATA: 101,
    LOSSLESS: 100,
    LOW: 1, // resampling to 150 px + compressed to jpeg100
    MEDIUM: 2 // resampling to 1000 px + compressed to jpeg100
};

/** Register commands from main thread **/
self.addEventListener('message', function(evt) {
    var type = evt.data.type;

    switch(type) {
    case 'setOrthancUrl':
        // Configure the ImageApiURl
        var orthancApiUrl = evt.data.orthancApiUrl;

        setImageApiUrl(orthancApiUrl);
        break;
    case 'getBinary':
        // Get an image binary
        var id = evt.data.id;
        var quality = evt.data.quality;
        var headers = evt.data.headers;
        var tags = evt.data.tags;

        getCommand(id, quality, headers, tags);
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

/** Get & Decompress Image from Orthanc **/
function getCommand(id, quality, headers, tags) {
    if (_processingRequest) {
        throw new Error('Another request is already in process within worker thread.');
    }

    // Retrieve & process image data.
    _processingRequest = new BinaryRequest(id, quality, headers, tags);
    _processingRequest.execute();
}

function BinaryRequest(id, quality, headers, tags) {
    this.id = id;
    this.quality = quality;
    this.tags = tags;
    this.compressionFormatPromise = null;
    this.headers = headers;

    // Parse url
    var splittedId = id.split(':');
    var instanceId = splittedId[0];
    var frameIndex = splittedId[1] || 0;
    
    var url = null;
    // Select the orthanc request url based on the desired image quality
    switch (quality) {
    case Qualities.PIXELDATA:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/pixeldata-quality';

        // Compression format depends on transfer synthax - either jpeg or
        // jpeg-lossless.
        var transferSyntaxRequest = new osimis.HttpRequest();
        transferSyntaxRequest.setResponseType('text');
        transferSyntaxRequest.setHeaders(headers);
        this.compressionFormatPromise = transferSyntaxRequest
            .get(OrthancApiURL + '/instances/' + instanceId + '/metadata/TransferSyntax')
            .then(function(response) {
                var transferSyntax = response.data;
                return transferSyntax;
            }, function(error) {
                // Request has failed. This is most likely because the
                // TransferSyntax metadata isn't available (instance must
                // either have been uploaded when Orthanc was at least 1.2.0 or
                // have been processed with the `/reconstruct` route
                // afterward).

                // We thus send an Orthanc 1.1.0 compatible request, although
                // much slower.
                var transferSyntaxRequest2 = new osimis.HttpRequest();
                transferSyntaxRequest2.setResponseType('json');
                transferSyntaxRequest2.setHeaders(headers);

                return transferSyntaxRequest2
                    .get(OrthancApiURL + '/instances/' + instanceId + '/header?simplify')
                    .then(function(response) {
                        var transferSyntax = response.data.TransferSyntaxUID;
                        return transferSyntax;
                    });
            })
            .then(function(transferSyntax) {
                switch(transferSyntax) {
                // Lossy JPEG 8-bit Image Compression.
                case '1.2.840.10008.1.2.4.50':
                    return 'jpeg';
                // JPEG Lossless, Nonhierarchical, First-Order Prediction
                // (Default Transfer Syntax for Lossless JPEG Image
                // Compression). -- jpeg FFC3
                case '1.2.840.10008.1.2.4.70':
                    return 'jpeg-lossless';
                default:
                    throw new Error('Unsupported transfer syntax ' + transferSyntax);
                }

            });

        break;
    case Qualities.LOSSLESS:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/high-quality';
        this.compressionFormatPromise = Promise.resolve('png');
        break;
    case Qualities.MEDIUM:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/medium-quality';
        this.compressionFormatPromise = Promise.resolve('jpeg');
        break;
    case Qualities.LOW:
        url = ImageApiURL + instanceId + '/' + frameIndex + '/low-quality';
        this.compressionFormatPromise = Promise.resolve('jpeg');
        break;
    default:
        _processingRequest = null; // cleaning request
        throw new Error('Undefined quality: ' + quality);
    }

    // Create request
    this.request = new osimis.HttpRequest();
    this.request.setResponseType('arraybuffer');
    this.request.setHeaders(headers);
    this.url = url;
}
BinaryRequest.prototype.execute = function() {
    var request = this.request;
    var url = this.url;
    var quality = this.quality;
    var compressionFormatPromise = this.compressionFormatPromise;
    var tags = this.tags;

    // Trigger request
    Promise
        .all([
            request.get(url),
            compressionFormatPromise
        ])
        .then(function(resp) {
            var imageResponse = resp[0];
            var compressionFormat = resp[1];

            try {
                // Process binary out of the klv.
                var arraybuffer = imageResponse.data;
                var data = parseKLV(arraybuffer);
                var decompressionOpts = {};
                
                // Decompress image binary into raw pixel.
                // @todo Use latest browser methods to do this faster.
                switch (compressionFormat.toLowerCase()) {
                case 'jpeg':
                    // Decompress lossy jpeg into 16bit
                    // @note IE10 & safari tested/compatible
                    var pixelArray = parseJpeg(data.decompression.binary);
                    pixelArray = convertBackTo16bit(pixelArray, {
                        hasColor: tags.PhotometricInterpretation !== "MONOCHROME1" && tags.PhotometricInterpretation !== "MONOCHROME2",
                        isSigned: !!(+tags.PixelRepresentation),
                        stretching: +tags.BitsStored === 8 ? null : {
                            // @note we still need
                            //     data.decompression.stretching as we'll lose
                            //     a ton' of dynamic if we stretch to
                            //     `2^tags.BitStored` (many jpeg only use 9
                            //     bits out of the 12 `said` to be stored by
                            //     the BitsStored tag).
                            low: data.decompression.stretching.low || 0,
                            high: data.decompression.stretching.high || Math.pow(2, tags.BitsStored)
                        }
                    });
                    break;
                case 'png':
                    // Decompress lossless png
                    // @note IE10 & safari tested/compatible
                    var pixelArray = parsePng({
                        binary: data.decompression.binary,
                        hasColor: tags.PhotometricInterpretation !== "MONOCHROME1" && tags.PhotometricInterpretation !== "MONOCHROME2",
                        isSigned: !!(+tags.PixelRepresentation)
                    });
                    break;
                case 'jpeg-lossless':
                    // Decompress lossless jpeg
                    // @warning IE11 & safari uncompatible - actual fix is to
                    //     always ask PNG conversion of PIXELDATA requested
                    //     quality in LOSSLESS. This may provide issues if we
                    //     for instance require availableQualities for other
                    //     things than chosing the desired image formats (ie.
                    //     add an indicator), but is not likely.
                    var pixelArray = parseJpegLossless({
                        binary: data.decompression.binary,
                        isSigned: !!(+tags.PixelRepresentation)
                    });
                    break;
                }

                // Calculate Min/Max values
                var maxPossiblePixelValue = Math.pow(2, tags.BitsStored);
                var minPixelValue = null;
                var maxPixelValue = null;
                if (tags.PhotometricInterpretation !== "MONOCHROME1" && tags.PhotometricInterpretation !== "MONOCHROME2") {
                    // Do not bother calculating values for rgb images (the dynamic is small for 8 bit luminosity, there is
                    // no point in having something specific)
                    minPixelValue = 0;
                    maxPixelValue = maxPossiblePixelValue;
                }
                else {
                    // Calculate min/max pixel value for greyscale images (can be more than 8 bits).
                    minPixelValue = maxPossiblePixelValue;
                    maxPixelValue = 0;
                    for (var i=0; i<pixelArray.length; ++i) {
                        if (pixelArray[i] < minPixelValue) {
                            minPixelValue = pixelArray[i];
                        }
                        if (pixelArray[i] > maxPixelValue) {
                            maxPixelValue = pixelArray[i];
                        }
                    }
                }

                data.cornerstone.minPixelValue = minPixelValue;
                data.cornerstone.maxPixelValue = maxPixelValue;

                // Calculate windowing
                var windowCenter = 0;
                var windowWidth = 0;
                // If windowing dicom tags are available, use them
                if (tags.WindowCenter && tags.WindowWidth) {
                    var windowCenters = tags.WindowCenter.split('\\');
                    var windowWidths = tags.WindowWidth.split('\\');

                    // Only take the first ww/wc available, ignore others (if 
                    // there is any).
                    windowCenter = +windowCenters[0];
                    windowWidth = +windowWidths[0];
                }
                // If windowing dicom tags are not available, generate
                // default windowing values using min/max pixel values.
                else if (tags.PhotometricInterpretation !== "MONOCHROME1" && tags.PhotometricInterpretation !== "MONOCHROME2") {
                    // Do not bother calculating values for rgb images (the dynamic is small for 8 bit luminosity, there is
                    // no point in having something specific)
                    windowCenter = 127.5;
                    windowWidth = 256;
                }
                else {
                    // For grayscale (8 bits or more) images, process default windowing.
                    // Ignore lower/higher bound for windowing calculus, since
                    // many image include an overlay of that color.
                    var minPixelValueForWWWC = maxPixelValue;
                    var maxPixelValueForWWWC = minPixelValue;
                    var margin = (maxPixelValue - minPixelValue) / (2 * tags.BitsStored);
                    for (var i=0; i<pixelArray.length; ++i) {
                        if (pixelArray[i] < minPixelValueForWWWC && pixelArray[i] > minPixelValue + margin) {
                            minPixelValueForWWWC = pixelArray[i];
                        }
                        if (pixelArray[i] > maxPixelValueForWWWC && pixelArray[i] < maxPixelValue - margin) {
                            maxPixelValueForWWWC = pixelArray[i];
                        }
                    }
                    // Make sure min/max for wwwc is realistic.
                    minPixelValueForWWWC = minPixelValueForWWWC + margin > maxPixelValueForWWWC ? minPixelValue : minPixelValueForWWWC;
                    maxPixelValueForWWWC = minPixelValueForWWWC + margin > maxPixelValueForWWWC ? maxPixelValue : maxPixelValueForWWWC;

                    windowCenter = minPixelValueForWWWC + (maxPixelValueForWWWC - minPixelValueForWWWC) / 2;
                    windowWidth = (maxPixelValueForWWWC - minPixelValueForWWWC) / 2 || 256;
                }

                // Adapt window width/center with the slope & intercept values.
                // Those calculation will be made internally by cornerstone,
                // with the following formulas:
                // windowCenter = windowCenter * slope + intercept;
                // windowWidth = windowWidth * slope;
                var slope = +tags.RescaleSlope || 1;
                var intercept = +tags.RescaleIntercept || 0;

                // Inject data in model.
                data.cornerstone.slope = slope;
                data.cornerstone.intercept = intercept;
                data.cornerstone.windowCenter = windowCenter;
                data.cornerstone.windowWidth = windowWidth;

                // if data.decompression.stretching !== null, update data.decompression.stretching's min|maxPixelValue
            }
            catch (e) {
                // Clean the processing request
                _processingRequest = null;
                
                // Log the stacktrace before rethrowing
                if (e.stack) {
                    console.log(e.stack);
                }
                throw e;
            }

            // Stock the format of the array, and return the array's buffer
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

            // Answer request to the main thread
            if(uaParser.browser.name.indexOf('IE') !== -1 && uaParser.browser.major <= 11) {
                // IE10 fallback for transferable objects. see
                // `https://connect.microsoft.com/IE/feedback/details/783468/ie10-window-postmessage-throws-datacloneerror-for-transferrable-arraybuffers`
                // For some reason, it doesn't work on IE11 either, even if
                // support is stated in official doc and no reported bug has
                // been found (perhaps only when WIN SP1 is not installed?).
                self.postMessage({
                    type: 'success',
                    cornerstoneMetaData: data.cornerstone,
                    pixelBuffer: pixelArray.buffer,
                    pixelBufferFormat: pixelBufferFormat
                });
            }
            else {
                self.postMessage({
                    type: 'success',
                    cornerstoneMetaData: data.cornerstone,
                    pixelBuffer: pixelArray.buffer,
                    pixelBufferFormat: pixelBufferFormat
                }, [pixelArray.buffer]); // pixelArray is transferable
            }
            

            // Clean the processing request
            _processingRequest = null;
        })
        .then(null, function(response) {
            // May be called by abort (@todo not sure this behavior is crossbrowser compatible)
            self.postMessage({
                type: 'failure',
                status: response.status,
                response: response // send whole response in case the error has been done by a throw
            });

            // Clean the processing request
            _processingRequest = null;
        })
        ;

};

BinaryRequest.prototype.abort = function() {
    // Abort the http request
    this.request.abort();

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
        Slope: 8,
        Intercept: 9,
        WindowCenter: 10,
        WindowWidth: 11,

        // - WebViewer related
        IsSigned: 12,

        // When 16bit image is converted to 8 bit, used convert image back to 16bit
        // in the web frontend with `minPixelValue` & `maxPixelValue`.
        MinPixelValue: 6,
        MaxPixelValue: 7,
        Stretched: 13, // set back 8bit to 16bit if true
        
        // Compression format
        Compression: 14,

        // used to zoom downsampled images back to original size
        // cornerstone doesn't support this natively, it's done in the viewport
        OriginalHeight: 15, 
        OriginalWidth: 16,

        // - Image binary
        ImageBinary: 17
    };
    
    // Data required by cornerstone to display the image correctly.
    var cornerstoneMetaData = {
        color: klvReader.getUInt(keys.Color),
        height: klvReader.getUInt(keys.Height),
        width: klvReader.getUInt(keys.Width),
        rows: klvReader.getUInt(keys.Height),
        columns: klvReader.getUInt(keys.Width),
        sizeInBytes: klvReader.getUInt(keys.SizeInBytes),

        columnPixelSpacing: klvReader.getFloat(keys.ColumnPixelSpacing),
        rowPixelSpacing: klvReader.getFloat(keys.RowPixelSpacing),
    
        // These value are processed by the frontend (within this worker) instead
        // because it's the only place we *always* have access to raw pixel (as  
        // we want to avoid having to decompress/recompress compressed images in 
        // the backend, for performance reason).
        minPixelValue: klvReader.getInt(keys.MinPixelValue),
        maxPixelValue: klvReader.getInt(keys.MaxPixelValue),
        slope: klvReader.getFloat(keys.Slope),
        intercept: klvReader.getFloat(keys.Intercept),
        windowCenter: klvReader.getFloat(keys.WindowCenter),
        windowWidth: klvReader.getFloat(keys.WindowWidth),
        // minPixelValue: null,
        // maxPixelValue: null,
        // slope: null,
        // intercept: null,
        // windowCenter: null,
        // windowWidth: null,

        originalHeight: klvReader.getUInt(keys.OriginalHeight),
        originalWidth: klvReader.getUInt(keys.OriginalWidth)
    };

    var compression = klvReader.getString(keys.Compression);
    // console.log('compression:' + compression);
    if (compression.toLowerCase() !== 'jpeg' && compression.toLowerCase() !== 'jpeg-lossless' && compression.toLowerCase() !== 'png') {
        _processingRequest = null; // cleaning request
        throw new Error('unknown compression: ' + compression);
    }
    
    // Data required to decompress the binary (inside this worker).
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

function parseJpeg(binary) {
    var jpegReader = new JpegImage();
    jpegReader.parse(binary);
    var s = jpegReader.getData(jpegReader.width, jpegReader.height);
    return s;
}

function parseJpegLossless(config) {
    var pixels;
    var decoder = new jpeg.lossless.Decoder();
    var s = new Uint8Array(decoder.decompress(config.binary.buffer));
    
    // decoder.numComp === 3 -> rgb
    // decoder.numComp === 1 -> grayscale
    // decoder.numBytes === 1/2 -> 8bit/16bit
    var bitCount = decoder.numBytes * 8;
    if (bitCount !== 8 && bitCount !== 16) {
        throw new Error("unsupported jpeg-lossless byte count: "+bitCount);
    }

    var isSigned = config.isSigned;
    //if (config.isSigned == true) { // config.isSigned != isSigned
    //    throw new Error("unexpected signed jpeg-lossless");
    //}

    var hasColor;
    if (decoder.numComp === 1) {
        hasColor = false;
    }
    else if (decoder.numComp === 3) {
        hasColor = true;
    }
    else { // maybe rgba ? probably not.
        throw new Error("unsupported jpeg-lossless component number: "+decoder.numComp)
    }

    var buf, pixels, index, i;
    if (hasColor) {
        // Convert rgb24 to rgb32

        buf = new ArrayBuffer(s.length / 3 * 4); // RGB32
        pixels = new Uint8Array(buf); // RGB24
        index = 0;
        for (i = 0; i < s.length; i += 3) {
            pixels[index++] = s[i];
            pixels[index++] = s[i + 1];
            pixels[index++] = s[i + 2];
            pixels[index++] = 255;  // Alpha channel
        }
    }
    else if (bitCount === 8 && !isSigned) {
        pixels = new Uint8Array(s.buffer);
    }
    else if (bitCount === 8 && isSigned) {
        pixels = new Int8Array(s.buffer);
    }
    else if (bitCount === 16 && !isSigned) {
        // except jpeg to be little endian
        pixels = new Uint16Array(s.buffer);
    }
    else if (bitCount === 16 && isSigned) {
        // except jpeg to be little endian
        pixels = new Int16Array(s.buffer);
    }
    else {
        throw new error("unsupported jpeg-lossless format");
    }

    return pixels;
}

function parsePng(config) {
    var pixels = null;
    var buf, index, i;

    var png = new PNG(config.binary);

    var s = png.decodePixels(); // returns Uint8 array

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

// if hasColor
//  -> Uint32 == Uint8 * 4 (RGBA)
// 
// if !hasColor && IsSigned
//  -> Int16
// 
// if !hasColor && !IsSigned
//  -> Uint16
// 
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
