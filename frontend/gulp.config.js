module.exports = function() {
    var client = './src/';
    var clientApp = client + 'app/';
    var report = './report/';
    var root = './';
    var specRunnerFile = 'specs.html';
    var temp = './.tmp/';
    var cssDir = temp;
    var scssDir = client + 'styles/';
    var wiredep = require('wiredep');
    var bowerFiles = wiredep({devDependencies: true})['js'];
    var bower = {
        json: require('./bower.json'),
        directory: './bower_components/',
        ignorePath: '..'
    };
    var nodeModules = 'node_modules';

    var config = {
        /**
         * File paths
         */
        // all javascript that we want to vet
        alljs: [
            '!./src/**/*.worker/**/*.js',
            './src/**/*.js',
            './*.js'
        ],
        build: './build/',
        client: client,
        cssDir: cssDir,
        css: cssDir + 'styles.css',
        fonts: [
            bower.directory + 'font-awesome/fonts/**/*.{eot,svg,ttf,woff,woff2}'
        ],
        html: client + '/*.html',
        htmltemplates: clientApp + '**/*.html',
        images: client + 'images/**/*.*',
        indexes: [
            client + 'index.html',
            client + 'plugin-entrypoint.html'
        ],
        config: client + 'config.js.embedded', // config file to copy in build
        // app js, with no specs
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.worker/**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        jsOrder: [
            '**/webviewer.module.js',
            '**/*.module.js',
            '**/*.js'
        ],
        scssDir: scssDir,
        scss: scssDir + 'styles.scss',
        report: report,
        root: root,
        source: 'src/',
        stubsjs: [
            bower.directory + 'angular-mocks/angular-mocks.js',
            client + 'stubs/**/*.js'
        ],
        temp: temp,
        tempIndexes: [
            temp + 'index.html',
            temp + 'plugin-entrypoint.html'
        ],
        /**
         * optimized files
         */
        optimized: {
            app: 'app.js',
            lib: 'lib.js'
        },

        /**
         * plato
         */
        plato: {js: clientApp + '**/*.js'},

        /**
         * browser sync
         */
        browserReloadDelay: 1000,

        /**
         * template cache
         */
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'webviewer',
                root: 'app/',
                standalone: false
            }
        },

        /**
         * Bower and NPM files
         */
        bower: bower,
        packages: [
            './package.json',
            './bower.json'
        ],

        /**
         * specs.html, our HTML spec runner
         */
        specRunner: client + specRunnerFile,
        specRunnerFile: specRunnerFile,

        /**
         * The sequence of the injections into specs.html:
         *  1 testlibraries
         *      mocha setup
         *  2 bower
         *  3 js
         *  4 spechelpers
         *  5 specs
         *  6 templates
         */
        testlibraries: [
            nodeModules + '/mocha/mocha.js',
            nodeModules + '/chai/chai.js',
            nodeModules + '/sinon-chai/lib/sinon-chai.js'
        ],
        specHelpers: [client + 'test-helpers/**/*.js'],
        specs: [clientApp + '**/*.spec.js'],

        /**
         * Node settings
         */
        nodeServer: './server.js',
        defaultPort: '5554'
    };

    /**
     * wiredep and bower settings
     */
    config.getWiredepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath,
            fileTypes: {
                scss: {
                  block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
                  detect: {
                    css: /@import\s['"](.+css)['"]/gi,
                    sass: /@import\s['"](.+sass)['"]/gi,
                    scss: /@import\s['"](.+scss)['"]/gi
                  },
                  replace: {
                    css: '@import "' + config.bower.ignorePath + '{{filePath}}";',
                    sass: '@import "' + config.bower.ignorePath + '{{filePath}}";',
                    scss: '@import "' + config.bower.ignorePath + '{{filePath}}";'
                  }
                }
            }
        };
        return options;
    };

    /**
     * karma settings
     */
    config.karma = getKarmaOptions();

    return config;

    ////////////////

    function getKarmaOptions() {
        var options = {
            files: [].concat(
                bowerFiles,
                config.specHelpers,
                client + 'config.js', // config file used to run tests

                // Make sure worker files aren't included
                {pattern: clientApp + '**/*.worker/*.js', included: false, served: true},

                clientApp + '**/*.module.js',
                clientApp + '*.js',
                clientApp + '**/!(*.worker)/*.js',
                temp + config.templateCache.file
            ),
            exclude: [
                // Exclude worker code uncompatible with mocha
                // clientApp + '**/*.worker/main.js',
            ],
            client: {
                // Mocha config
                mocha: {
                    // asyncOnly: true,
                    // ignoreLeaks: false,
                    timeout: 1200000 // Set a long timeout for orthanc to process requests on slow servers
                },
                // Load workers-related files in web workers
                mochaWebWorker: {
                    pattern : [
                        clientApp + '**/*.worker/*.js'
                    ],
                }
            },

            coverage: {
                dir: report + 'coverage',
                reporters: [
                    // reporters not supporting the `file` property
                    {type: 'html', subdir: 'report-html'},
                    {type: 'lcov', subdir: 'report-lcov'},
                    {type: 'text-summary'} //, subdir: '.', file: 'text-summary.txt'}
                ]
            },
            preprocessors: {}
        };
        // options.preprocessors[clientApp + '**/!(*.spec)+(.js)'] = ['coverage'];
        return options;
    }
};
