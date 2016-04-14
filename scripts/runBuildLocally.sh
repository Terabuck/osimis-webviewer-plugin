#!/bin/bash

# @warning script should be launched from the osimis-webviewer root

# npm cache clean # make sure install is fine
npm install

bower install

#first run the unit tests
gulp test --novet # --novet disables jshint and jscs

#run gulp build after the unit tests (unit tests seems to clean the gulp build output)
gulp build

# npm cache clean
