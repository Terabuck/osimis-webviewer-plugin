/*jshint node:true*/
'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var osisync = require('osisync');
var httpProxy = require('http-proxy');

var port = process.env.PORT || 5554;

var environment = process.env.NODE_ENV;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(logger('dev'));

console.log('About to crank up node');
console.log('PORT=' + port);
console.log('NODE_ENV=' + environment);

// setting proxies
var orthancProxy = httpProxy.createProxyServer();
app.all("/orthanc/*", function(req, res) {
    var orthancUrl = 'http://localhost:8042/';

    console.log('redirecting to Orthanc server');
    req.url = req.url.replace('/orthanc', '');
    console.log(req.url);
    console.log("final Url:", orthancUrl + req.url);

    // There's a problem when handling post requests, replace the bodyParser middleware as in https://github.com/nodejitsu/node-http-proxy/issues/180
    // and handle manually the body parsing
    req.removeAllListeners('data');
    req.removeAllListeners('end');

    process.nextTick(function () {
    if(req.body) {
        if(req.header("Content-Type") == "application/x-www-form-urlencoded"){
            req.emit('data', serializedIntoFormData(req.body));
        }else{
            req.emit('data', JSON.stringify(req.body));
        }

    }
    req.emit('end');
    });
    orthancProxy.web(req, res, {target: orthancUrl});
});

switch (environment){
    case 'build':
        console.log('** BUILD **');
        app.use(express.static('./build/'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            // @todo 404
            // four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        // app.use('/*', express.static('./build/index.html'));
        break;
    default:
        console.log('** DEV **');

        if (osisync.master) {
            // overload the index.html with the osisync-master injected one
            app.use(express.static('./.osisync/'));
        }

        app.use(express.static('./.tmp'));
        app.use(express.static('./src/'));
        app.use(express.static('./'));

        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            // @todo 404
            // four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        // app.use('/*', express.static('./.tmp/index.html'));
        break;
}

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
    console.log('env = ' + app.get('env') +
        '\n__dirname = ' + __dirname  +
        '\nprocess.cwd = ' + process.cwd());
});
