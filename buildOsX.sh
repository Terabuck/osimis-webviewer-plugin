#!/bin/bash

# @pre
# Install xcode using apple store

set -x
set -e

# Build Frontend & install local dependencies (req. by C++ plugin)
cd frontend/
npm install
git checkout node_modules/gulp-injectInlineWorker/index.js
bower install
gulp build
cd ../

# Build plugin
./backend/scripts/buildLocal.sh

# Run nginx
nginx -p ./reverse-proxy/ -c nginx.local.conf

# Run Frontend Dev Process
cd frontend/
gulp serve-dev &
gulpPid=$!
cd ../

# Run Orthanc + Plugin
cd ./backend/build/
./Orthanc configOSX.json &
orthancPid=$!
cd ../../

# Kill orthanc, gulp & nginx on CTRL+C
trap "kill ${orthancPid}; kill ${gulpPid}; nginx -p ./reverse-proxy/ -c nginx.local.conf -s stop" SIGINT
wait