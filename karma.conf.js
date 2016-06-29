module.exports = function(config) {
    var gulpConfig = require('./gulp.config')();

    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: './',

        // frameworks to use
        // some available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'chai', 'sinon', 'chai-sinon', 'mocha-webworker'],

        // list of files / patterns to load in the browser
        files: gulpConfig.karma.files,

        // list of files to exclude
        exclude: gulpConfig.karma.exclude,

        client: gulpConfig.karma.client,

        proxies: {
            // Add orthanc route
            '/orthanc/': 'http://localhost:8042/',
            // Proxy for web worker to work with mocha
            '/app/': '/base/src/app/',
            '/bower_components/': '/base/bower_components/',
            '/config.js': '/base/src/config.js'
        },

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: gulpConfig.karma.preprocessors,

        // test results reporter to use
        // possible values: 'dots', 'progress', 'coverage'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['mocha'/*, 'coverage'*/],

        mochaReporter: {
            output: 'full',
            showDiff: 'unified'
        },
        
        // coverageReporter: {
        //     dir: gulpConfig.karma.coverage.dir,
        //     reporters: gulpConfig.karma.coverage.reporters
        // },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
        // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        //        browsers: ['Chrome', 'ChromeCanary', 'FirefoxAurora', 'Safari', 'PhantomJS'],
        browsers: ['PhantomJS'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // fix phantomjs issue: http://stackoverflow.com/a/33802985/939741
        // we reload phantomjs everytimes it fails up to 100 times...
        captureTimeout: 60000,
        browserDisconnectTimeout: 10000,
        browserDisconnectTolerance: 100, // by default 0
        browserNoActivityTimeout: 1000 // by default 10000
    });
};
