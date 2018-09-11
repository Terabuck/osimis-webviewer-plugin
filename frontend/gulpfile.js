var yargs = require('yargs');
var args = yargs.argv;
var taskName = args._[0];
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var del = require('del');
var glob = require('glob');
var gulp = require('gulp');
var path = require('path');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var _ = require('lodash');
var $ = require('gulp-load-plugins')({lazy: true});
var osisync = require('osisync');
$.injectInlineWorker = require('gulp-injectInlineWorker/index.js');
var mergeStream = require('merge-stream')

// Set optional dev dependencies
if (taskName === 'serve-dev' || taskName === 'serve-build' || taskName === 'osisync') {
    $.nodemon = require('gulp-nodemon') || null;
    $.jscs = require('gulp-jscs') || null;
    $.jshint = require('gulp-jshint') || null;
}

var colors = $.util.colors;
var envenv = $.util.env;

var serverPort = osisync.getPort() || process.env.PORT || config.defaultPort;
var browserSyncPort = osisync.getPort() || 3000;
var browserSyncUiPort = osisync.getPort() || 3001;
var weinrePort = osisync.getPort() || 9090;
var nodeDebugPort = osisync.getPort() || 5858;

var gulp_src = gulp.src;
gulp.src = function() {
  return gulp_src.apply(gulp, arguments)
    .pipe(plumber(function(error) {
      // Output an error message
      //gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
      gutil.log(error);
      // emit the end event, to properly end the task
      process.exit(1);
    })
  );
};

/**
 * yargs variables can be passed in to alter the behavior, when present.
 * Example: gulp serve-dev
 *
 * --exit-on-test-failed : exit gulp with error when tests fail.
 * --verbose  : Various tasks will produce more output to the console.
 * --nosync   : Don't launch the browser with browser-sync when serving code.
 * --debug    : Launch debugger with node-inspector.
 * --debug-brk: Launch debugger and break on 1st line with node-inspector.
 * --startServers: Will start servers for midway tests on the test task.
 * --novet    : Disable jscs & jshint
 * --nojscs   : Disable jscs
 */

/**
 * List the available gulp tasks
 */
gulp.task('help', $.taskListing);
gulp.task('default', gulp.series('help'));

/**
 * vet the code and create coverage report
 * @return {Stream}
 */
gulp.task('vet', function() {
    if (!args.novet) {
        log('Analyzing source with JSHint and JSCS');

        return gulp
            .src(config.alljs)
            .pipe($.if(args.verbose, $.print()))
            .pipe($.jshint())
            .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
    //        .pipe($.jshint.reporter('fail'))
            .pipe($.if(!args.nojscs, $.jscs()));
    }
});

/**
 * Create a visualizer report
 */
gulp.task('plato', function(done) {
    log('Analyzing source with Plato');
    log('Browse to /report/plato/index.html to see Plato results');

    startPlatoVisualizer(done);
});

/**
 * Remove all files from the build, temp, and reports folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', function(done) {
    var delconfig = [].concat(config.build, config.temp, config.report);
    log('Cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

/**
 * Remove all fonts from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-fonts', function(done) {
    clean(config.build + 'fonts/**/*.*', done);
});

/**
 * Remove all images from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-images', function(done) {
    clean(config.build + 'images/**/*.*', done);
});

/**
 * Remove all styles from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-styles', function(done) {
    var files = [].concat(
        config.temp + '**/*.css',
        config.build + 'styles/**/*.css'
    );
    clean(files, done);
});

/**
 * Remove all js and html from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-code', function(done) {
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + 'js/**/*.js',
        config.build + '**/*.html'
    );
    clean(files, done);
});

/**
 * Compile scss to css
 * @return {Stream}
 */
gulp.task('styles', gulp.series('clean-styles'), function() {
    log('Compiling scss --> CSS');

    return gulp
        .src(config.scss)
        .pipe($.compass({
            project: __dirname + '/',
            css: config.cssDir,
            sass: config.scssDir
        }))
//        .on('error', errorLogger) // more verbose and dupe output. requires emit.
        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.temp));
});

/**
 * Copy fonts
 * @return {Stream}
 */
gulp.task('fonts', gulp.series('clean-fonts'), function() {
    log('Copying fonts');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

/**
 * Compress images
 * @return {Stream}
 */
gulp.task('images', gulp.series('clean-images'), function() {
    log('Compressing and copying images');

    return gulp
        .src(config.images)
        // .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.build + 'images'));
});

/**
 * Create $templateCache from the html templates
 * @return {Stream}
 */
gulp.task('templatecache', gulp.series('clean-code'), function() {
    log('Creating an AngularJS $templateCache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.if(args.verbose, $.bytediff.start()))
        .pipe($.minifyHtml({empty: true}))
        .pipe($.if(args.verbose, $.bytediff.stop(bytediffFormatter)))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
});

/**
 * Inject all the spec files into the specs.html
 * @return {Stream}
 */
gulp.task('build-specs', gulp.series('templatecache'), function(done) {
    log('building the spec runner');

    var wiredep = require('wiredep').stream;
    var templateCache = config.temp + config.templateCache.file;
    var options = config.getWiredepDefaultOptions();
    var specs = config.specs;

    if (args.startServers) {
        specs = [].concat(specs, config.serverIntegrationSpecs);
    }
    options.devDependencies = true;

    return gulp
        .src(config.specRunner)
        .pipe(wiredep(options))
        .pipe(inject(config.js, '', config.jsOrder))
        .pipe(inject(config.testlibraries, 'testlibraries'))
        .pipe(inject(config.specHelpers, 'spechelpers'))
        .pipe(inject(specs, 'specs', ['**/*']))
        .pipe(inject(templateCache, 'templates'))
        .pipe(gulp.dest(config.client));
});

/**
 * Wire-up the bower dependencies
 * @return {Stream}
 */
gulp.task('wiredep-scss', function() {
    log('Wiring the bower dependencies into the scss');

    var wiredep = require('wiredep').stream;
    var options = config.getWiredepDefaultOptions();

    return gulp
        .src(config.scss)
        .pipe(wiredep(options))
        .pipe(gulp.dest(config.scssDir));
});

/**
 * Wire-up the bower dependencies
 * @return {Stream}
 */
gulp.task('wiredep', gulp.series('wiredep-scss'), function() {
    log('Wiring the bower dependencies into the html');

    var wiredep = require('wiredep').stream;
    var options = config.getWiredepDefaultOptions();

    // Only include stubs if flag is enabled
    var js = args.stubs ? [].concat(config.js, config.stubsjs) : config.js;

    // gulp.fonts contains the eot, svg, ttf, ... file paths (with glob)
    // this command replace those extensions with .css
    // as it is the standard that font packages comes with a .css in the same folder as the fonts to
    // include them.
    // we inject these .css which themself include the .eot, .svg, ...
    var fonts = config.fonts.map(
        function (a) { return a.replace(/^(.*)(\.[^.\/]*)$/i, '$1.css'); }
    );

    return gulp
        .src(config.indexes)
        .pipe(wiredep(options))
        .pipe(inject(js, '', config.jsOrder))
        .pipe(inject(fonts, 'fonts'))
        .pipe(gulp.dest(config.temp));
});

gulp.task('inject', gulp.series('wiredep', 'styles', 'templatecache'), function() {
    log('Wire up css into the html, after files are ready');

    var pipe = gulp
        .src(config.tempIndexes)
        .pipe(inject(config.css))
        .pipe(gulp.dest(config.temp));

    if (osisync.master) {
        pipe = pipe
            .pipe(osisync.master.processHtmlStream())
            .pipe(gulp.dest('./.osisync/'));
    }

    return pipe;
});

/**
 * Optimize all files, move to a build folder,
 * and inject them into the new index.html
 * @return {Stream}
 */
gulp.task('optimize', gulp.series('inject'), function() {
    log('Optimizing the js, css, and html');

    var assets = $.useref.assets({searchPath: ['./', config.client]});
    // Filters are named for the gulp-useref path
    var cssFilter = $.filter('**/*.css');
    var jsAppFilter = $.filter('**/' + config.optimized.app);
    var jslibFilter = $.filter('**/' + config.optimized.lib);

    var templateCache = config.temp + config.templateCache.file;

    // Assume .css font-inject files exist in the font directories
    var fontsCss = config.fonts.map(
        function (a) { return a.replace(/^(.*)(\.[^.\/]*)$/i, '$1.css'); }
    );

    // Copy config file (src/config.js.embedded)
    var configStream = gulp
        .src(config.config)
        .pipe($.rename('config.js'))
        .pipe(gulp.dest(config.build));

    // Build/Optimise js, css & html
    var buildStream = gulp
        .src(config.tempIndexes.concat(['./bower.json']))
        .pipe(inject(templateCache, 'templates'))
        // Replace the font .css locations
        .pipe(inject(fontsCss, 'fonts'))
        .pipe(assets) // Concatenate all assets from the html with useref
        // @todo remove duplicate build files (induced by duplicate build file request on different *.html)
        // Get the css
        .pipe(cssFilter)
        .pipe($.cleanCss())
        .pipe(cssFilter.restore())
        // Get the custom javascript
        .pipe(jsAppFilter)
        .pipe($.injectInlineWorker({ // Inlines worker scripts' path to BLOB
            pathRouter: {
                '/app/': './src/app/',
                '/bower_components/': './bower_components/'
            }
        }))
        .pipe($.ngAnnotate({add: true}))
        //.pipe($.uglify())
        .pipe(getHeader())
        .pipe(jsAppFilter.restore())
        // Get the vendor javascript
        .pipe(jslibFilter)
        //.pipe($.uglify()) // another option is to override wiredep to use min files
        .pipe(jslibFilter.restore())
        // Take inventory of the file names for future rev numbers
        // .pipe($.rev())
        // Apply the concat and file replacement with useref
        .pipe(assets.restore())
        .pipe($.useref())
        // Replace the file names in the html & bower.json with rev numbers
        //   .pipe($.revReplace({
        //      replaceInExtensions: ['.js', '.css', '.html', '.hbs', '.json'] // Replace also in bower.json
        //   }))
        .pipe(gulp.dest(config.build));
        // Write the rev-manifest.json - used by @osisync
        // .pipe($.rev.manifest())
        // .pipe(gulp.dest(config.build));

    return mergeStream(configStream, buildStream);
});

/**
 * Run the spec runner
 * @return {Stream}
 */
gulp.task('serve-specs', gulp.series('build-specs'), function(done) {
    log('run the spec runner');
    serve(true /* isDev */, true /* specRunner */);
    done();
});


gulp.task('copy-languages', function() {
   return gulp
       .src(config.client + 'languages/**/*')
       .pipe(gulp.dest(config.build + 'languages'));
});

/**
 * Build everything
 * This is separate so we can run tests on
 * optimize before handling image or fonts
 */
gulp.task('build', gulp.series('optimize', 'images', 'fonts', 'copy-languages'), function() {
    log('Building everything');

    var msg = {
        title: 'gulp build',
        subtitle: 'Deployed to the build folder',
        message: 'Running `gulp serve-build`'
    };
    del(config.temp);
    log(msg);
});

/**
 * Run specs once and exit
 * To start servers and run midway specs as well:
 *    gulp test --startServers
 * @return {Stream}
 */
gulp.task('test', gulp.series('templatecache'), function(done) {
    startTests(true /*singleRun*/ , done);
});

/**
 * Run specs and wait.
 * Watch for file changes and re-run tests on each change
 * To start servers and run midway specs as well:
 *    gulp autotest --startServers
 */
gulp.task('autotest', function(done) {
    startTests(false /*singleRun*/ , done);
});

/**
 * serve the dev environment
 * --debug-brk or --debug
 * --nosync
 */
gulp.task('serve-dev', gulp.series('inject'), function() {
    serve(true /*isDev*/);
});

// inject index.html
// start browsersync w/ new index.html watch
// send CLI info

/**
 * serve the osisync *slave* dev environment
 * watch and preprocess files
 */
gulp.task('osisync', gulp.series('inject'), function() {
    log('OsiSync: Watch and update changes and serve files');

    gulp.watch(config.indexes, ['inject']);
    gulp.watch([config.scssDir+'**/*'], ['styles']);
    gulp.watch([config.htmltemplates], ['templatecache']);

    // start the server
    var env = _.cloneDeep(process.env); // make sure OSISYNC_* are present
    env.PORT = serverPort;
    env.NODE_ENV = 'dev';

    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: env,
        watch: [config.nodeServer],
        nodeArgs: ['--debug' + '=' + nodeDebugPort],
        stdOut: true
    };

    if (args.verbose) {
        console.log(nodeOptions);
    }

    // @todo use standard express start instead of nodemon - no need to restart the server
    return $.nodemon(nodeOptions)
        .on('start', function () {
            console.log('*** nodemon started');

            // @todo should be in server.js with real ports
            osisync.slave.start({
                host: 'localhost',
                port: serverPort
            });
        });
});

/**
 * serve the build environment
 * --debug-brk or --debug
 * --nosync
 */
gulp.task('serve-build', gulp.series('build'), function() {
    serve(false /*isDev*/);
});

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('bump', function() {
    var msg = 'Bumping versions';
    var type = args.type;
    var version = args.ver;
    var options = {};
    if (version) {
        options.version = version;
        msg += ' to ' + version;
    } else {
        options.type = type;
        msg += ' for a ' + type;
    }
    log(msg);

    return gulp
        .src(config.packages)
        .pipe($.print())
        .pipe($.bump(options))
        .pipe(gulp.dest(config.root));
});

/**
 * Optimize the code and re-load browserSync
 */
gulp.task('browserSyncReload', gulp.series('optimize'), browserSync.reload);


////////////////

/**
 * When files change, log it
 * @param  {Object} event - event that fired
 */
function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    var options = {read: false};
    if (label) {
        options.name = 'inject:' + label;
    }

    return $.inject(orderSrc(src, order), options);
}

/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc (src, order) {
    //order = order || ['**/*'];
    return gulp
        .src(src)
        .pipe($.if(order, $.order(order)));
}

/**
 * serve the code
 * --debug-brk or --debug
 * --nosync
 * @param  {Boolean} isDev - dev or build mode
 * @param  {Boolean} specRunner - server spec runner html
 */
function serve(isDev, specRunner) {
    var debugMode = '--debug';
    var nodeOptions = getNodeOptions(isDev);

    nodeOptions.nodeArgs = [debugMode + '=' + nodeDebugPort];

    if (args.verbose) {
        console.log(nodeOptions);
    }

    var onRestartGulpTasks = [];
    if (!args.novet) onRestartGulpTasks.push('vet');

    // @note by Thibault at 26.07.2017 - gulp-nodemon crashes from no reason
    // since last update. We don't bother for our needs. Let's just use an
    // hacky `require` to launch the frontend development server instead.
    //
    // return $.nodemon(nodeOptions)
    //     .on('restart', onRestartGulpTasks, function(ev) {
    //         log('*** nodemon restarted');
    //         log('files changed:\n' + ev);
    //         setTimeout(function() {
    //             browserSync.notify('reloading now ...');
    //             browserSync.reload({stream: false});
    //         }, config.browserReloadDelay);
    //     })
    //     .on('start', function () {
    //         log('*** nodemon started');
    //         startBrowserSync(isDev, specRunner);
    //     })
    //     .on('crash', function () {
    //         log('*** nodemon crashed: script crashed for some reason');
    //     })
    //     .on('exit', function () {
    //         log('*** nodemon exited cleanly');
    //     });

    process.env.PORT = serverPort;
    process.env.NODE_ENV = isDev ? 'dev' : 'build';
    require('./server.js')
}

function getNodeOptions(isDev) {
    var env = _.cloneDeep(process.env); // make sure OSISYNC_* are present
    env.PORT = serverPort;
    env.NODE_ENV = isDev ? 'dev' : 'build';

    return {
        script: config.nodeServer,
        delayTime: 1,
        env: env,
        watch: [config.nodeServer],
        stdOut: true
    };
}

//function runNodeInspector() {
//    log('Running node-inspector.');
//    log('Browse to http://localhost:8080/debug?port='+nodeDebugPort);
//    var exec = require('child_process').exec;
//    exec('node-inspector');
//}

/**
 * Start BrowserSync
 * --nosync will avoid browserSync
 */
function startBrowserSync(isDev, specRunner) {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting BrowserSync on port ' + browserSyncPort);

    // If build: watches the files, builds, and restarts browser-sync.
    // If dev: watches scss, compiles it to css, browser-sync handles reload
    if (isDev) {
        gulp.watch(config.indexes, ['inject']);
        gulp.watch([config.scssDir+'**/*'], ['styles']);
        gulp.watch([config.htmltemplates], ['templatecache']);

        gulp.watch([
            !!osisync.master ? '.osisync/index.html' : 'index.html',
            '.tmp/*',
            config.js
        ]).on('change', changeEvent);
    } else {
        gulp.watch([config.scss, config.js, config.html], ['browserSyncReload'])
            .on('change', changeEvent);
    }

    var options = {
        proxy: 'localhost:' + serverPort,
        port: browserSyncPort,
        ui: {
            port: browserSyncUiPort,
            weinre: {
                port: weinrePort
            }
        },
        files: isDev ? [
            config.client + '**/*.*',
            '!' + config.scss,
            config.temp + '**/*.*'
        ] : [],
        ghostMode: false, // disable ghostMode
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'info',
        logPrefix: 'osimis',
        notify: true,
        open: false,
        reloadDelay: 0 //1000
    };

    if (specRunner) {
        options.startPath = config.specRunnerFile;
    }

    if (osisync.master) {
        // use osisync index.html instead of the default one
        options.files = [
            '!' + config.client + 'index.html',
            './.osisync/index.html'
        ].concat(options.files);
    }

    // @todo
    // https://www.browsersync.io/docs/gulp/
    // https://www.npmjs.com/package/browser-sync-angular-template
    // https://github.com/shakyShane/browser-sync-spa
    browserSync(options);

    if (osisync.master) {
        browserSync.emitter.on("init", function () {
            osisync.master.start({
                serverPort: serverPort,
                browserSyncPort: browserSyncPort,
                browserSyncUiPort: browserSyncUiPort,
                weinrePort: weinrePort,
                nodeDebugPort: nodeDebugPort
            });
        });
    }
}

/**
 * Start Plato inspector and visualizer
 */
function startPlatoVisualizer(done) {
    log('Running Plato');

    var files = glob.sync(config.plato.js);
    var excludeFiles = /.*\.spec\.js/;
    var plato = require('plato');

    var options = {
        title: 'Plato Inspections Report',
        exclude: excludeFiles
    };
    var outputDir = config.report + '/plato';

    plato.inspect(files, outputDir, options, platoCompleted);

    function platoCompleted(report) {
        var overview = plato.getOverviewReport(report);
        if (args.verbose) {
            log(overview.summary);
        }
        if (done) { done(); }
    }
}

/**
 * Start the tests using karma.
 * @param  {boolean} singleRun - True means run once and end (CI), or keep running (dev)
 * @param  {Function} done - Callback to fire when karma is done
 * @return {undefined}
 */
function startTests(singleRun, done) {
    var child;
    var excludeFiles = [];
    var fork = require('child_process').fork;
    var karma = require('karma');
    var serverSpecs = config.serverIntegrationSpecs;

    if (args.startServers) {
        log('Starting servers');
        var savedEnv = process.env;
        savedEnv.NODE_ENV = 'dev';
        savedEnv.PORT = 8888;
        child = fork(config.nodeServer);
    } else {
        if (serverSpecs && serverSpecs.length) {
            excludeFiles = serverSpecs;
        }
    }

    var karmaServer = new karma.Server({
        configFile: __dirname + '/karma.conf.js',
        exclude: excludeFiles,
        singleRun: !!singleRun
    }, karmaCompleted);
    karmaServer.start();

    ////////////////

    function karmaCompleted(karmaResult) {
        log('Karma completed');
        if (child) {
            log('shutting down the child process');
            child.kill();
        }
        if (karmaResult === 1) {
            log('karma: tests failed with code ' + karmaResult);
            done();
            if (args.exitOnTestFailed) {
                process.exit(karmaResult);
            }
        } else {
            done();
        }
    }
}

/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' +
        (data.endSize / 1000).toFixed(2) + ' kB and is ' +
        formatPercent(1 - data.percent, 2) + '%' + difference;
}

/**
 * Log an error message and emit the end of a task
 */
//function errorLogger(error) {
//    log('*** Start of Error ***');
//    log(error);
//    log('*** End of Error ***');
//    this.emit('end');
//}

/**
 * Format a number as a percentage
 * @param  {Number} num       Number to format as a percent
 * @param  {Number} precision Precision of the decimal
 * @return {String}           Formatted perentage
 */
function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
}

/**
 * Format and return the header for files
 * @return {String}           Formatted file header
 */
function getHeader() {
    var pkg = require('./package.json');
    var template = ['/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @authors <%= pkg.authors %>',
        ' * @version v<%= pkg.version %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''
    ].join('\n');
    return $.header(template, {
        pkg: pkg
    });
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

module.exports = gulp;
