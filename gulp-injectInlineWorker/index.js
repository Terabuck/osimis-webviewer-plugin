// Gulp plugin to convert string to BLOB URI for webworker inlining

// Usage:
// 
// In main thread js files: 
//   In front of the path string, put:
//       /* @inline-worker: */
//   For instance: 
//       var path = /* @inline-worker: */ '/app/image/image-parser.worker/main.js';
//   You can free created ObjectUrls like this:
//       // Free inline-worker's ObjectUrl
//       if (typeof pathURL !== 'string') URL.revokeObjectUrl(path);
// 
// In worker thread js files:
//   you can use importScripts(...), eg:
//       importScripts('/app/image/image-parser.worker/klvreader.class.js');
// 
// For path string,
//   - Do not use double quote (use single ones) 
//   - Do not use variables
//   - Do not use escaped quote
//   - Do not concatenate strings
//   -> Only put clean strings
// 
// In Gulp, eg:
//   gulp
//     .src('mainThreadFile.js')
//     .pipe($.injectInlineWorker({
//         pathRouter: {
//             '/app/': './src/app/',
//             '/bower_components/': './bower_components/'
//         }
//     }))
//     .pipe(gulp.dest('mainThreadFile.injected.js');

var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-injectInlineWorker';

var injectInlineWorker = function(opts) {
    return through.obj(function(file, encoding, callback) {
        // Ignore empty files
        if (file.isNull()) {
            return callback(null, file);
        }

        // No stream support, only files.
        if (file.isStream()) {
            this.emit('error', new PluginError('gulp-injectInlineWorker', 'Streams not supported!'));
            return callback('Streaming not supported', file);
        }
        if (!file.isBuffer()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Unknown stream type!'));
            return;
        }

        // Ignore non js files
        if (!file.relative.endsWith('.js')) {
            return callback(null, file);
        }

        // Process file if everything seems ok
        var input = file.contents.toString();
        var workerPathRegex = /(?:\/\*\s*@inline-worker:\s*\*\/)\s'([^']*)'/g;
        var importScriptsRegex = /importScripts\('([^']*)'\)/g;

        // Inline marked worker path with the path's file content
        var output = input.replace(workerPathRegex, function(match, p1, offset, string) {
            // Load worker script content
            var workerPath = _getRealPath(p1, opts && opts.pathRouter);
            var workerContent = fs.readFileSync(workerPath, 'utf8');

            // Inline imported scripts
            workerContent = workerContent.replace(importScriptsRegex, function(match, p1, offset, string) {
                // Load importScript content
                var importScriptPath = _getRealPath(p1, opts && opts.pathRouter);
                var importScriptContent = fs.readFileSync(importScriptPath, 'utf8');

                return importScriptContent;
            });

            // Escape worker content - http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
            workerContent = workerContent.replace(/\\/g, "\\\\");
            workerContent = workerContent.replace(/'/g, "\\\'");
            workerContent = workerContent.replace(/\r/g, "\\r");
            workerContent = workerContent.replace(/\n/g, "\\n");
            workerContent = workerContent.replace(/\u2028/g, "\\u2028");
            workerContent = workerContent.replace(/\u2029/g, "\\u2029");

            // Wrap worker content with blob string creator
            var wrappedWorkerContent = '(URL.createObjectURL(new Blob([\''+workerContent+'\'], {type: \'application/javascript\'})))';

            // Convert path to blob
            return wrappedWorkerContent;
        });

        file.contents = new Buffer(output);

        return callback(null, file);
    });
}

// Get a relative path using the pathRouter option
function _getRealPath(pathFromCode, router) {
    if (!router) {
        return path.normalize(pathFromCode);
    }

    var realPath = pathFromCode;

    // Replace code path to real relative path using the router in option
    for (var codePath in router) {
        realPath = realPath.replace(new RegExp('^'+codePath), router[codePath]);
    }

    // Convert os specific separators
    realPath = path.normalize(realPath);

    return realPath;
}

module.exports = injectInlineWorker;
