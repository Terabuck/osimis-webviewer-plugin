#!/bin/bash

set -e #to exit script at first command failure
set -x #to debug the script

cd /osimis-webviewer-plugin/frontend

# npm cache clean # make sure install is fine
npm install --unsafe-perm --python=python2.7

# install 2 times (for random phantom_js download issues)
npm install --unsafe-perm --python=python2.7

bower install --allow-root

#first run the unit tests
# gulp test --novet # --novet disables jshint and jscs

#run gulp build after the unit tests (unit tests seems to clean the gulp build output)
gulp build

# npm cache clean
 

