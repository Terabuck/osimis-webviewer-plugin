'use strict';

importScripts('/app/image/image-parser.async/klvreader.class.js');
importScripts('/bower_components/jpgjs/jpg.js'); // @todo in build mode


var KLVReader = WorkerGlobalScope.KLVReader;

self.addEventListener('message', function(evt) {
    var uri = evt.data;
	
	// var instanceId = evt.data.instanceId;
	// var frameIndex = evt.data.frameIndex;
	// var compression = evt.data.compression;
    
    getURI(uri);
}, false);


function getURI(uri) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', encodeURI(uri), false);
    xhr.responseType = 'arraybuffer';
    xhr.send();

    if (xhr.status === 200) {
        // process binary into jpeg
        var arraybuffer = xhr.response;
        var metaData = parseKLV(arraybuffer);
        var pixelArray = parseJpeg(metaData.decompression);

        // stock the format of the array, and return the array's buffer
        // with its format instead of the array itself (array can't be worker transferable object but buffer can)
        var pixelBufferFormat = null;
        if (pixelArray instanceof Uint8Array) {
            pixelBufferFormat = 'Uint8';
        }
        else if (pixelArray instanceof Uint16Array) {
            pixelBufferFormat = 'Uint16';
        }
        else if (pixelArray instanceof Int16Array) {
            pixelBufferFormat = 'Int16';
        }
        else {
            throw new Error("Unexpected array binary format");
        }

        // answer request to the main thread
        self.postMessage({
            cornerstoneMetaData: metaData.cornerstone,
            pixelBuffer: pixelArray.buffer,
            pixelBufferFormat: pixelBufferFormat
        }, [pixelArray.buffer]); // pixelArray is transferable
    }
    else {
        // @todo
        throw new Error('Request failed.  Returned status of ' + xhr.status);
    }
}

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


        // - Image binary
        ImageBinary: 15
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
        windowWidth: klvReader.getFloat(keys.WindowWidth)
    };

    var compression = klvReader.getString(keys.Compression);
    if (compression !== 'Jpeg') {
        throw new Error('unknown compression');
    }

    var decompressionMetaData = {
        binary: klvReader.getBinary(keys.ImageBinary),
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
    var pixels = null;
    var buf, index, i;

    if (config.hasColor) {
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
