#!/bin/bash

# This file installs development dependencies not used in our continous integration

# Start from the right place
previousDir=$(pwd)
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/
cd "frontend/"

# Install compass (requires ruby)
gem update --system
gem install compass

# Install global dependencies
npm install -g bower gulp
npm install -g nodemon marked jsonlint jshint eslint jscs phantomjs protractor karma-cli
webdriver-manager update

# Install additional NPM dependencies
npm install karma-firefox-launcher karma-growl-reporter\
			phantomjs-prebuilt karma-phantomjs-launcher karma-safari-launcher karma-slimerjs-launcher\
			karma-coverage plato jshint-stylish\
			gulp-jscs gulp-jshint\
			gulp-nodemon\
    		https://registry.npmjs.org/http-proxy/-/http-proxy-1.13.2.tgz

cd "$previousDir"