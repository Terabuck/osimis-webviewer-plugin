#!/bin/bash

# @description
# This script builds the viewer plugin, launches orthanc with it, launches a 
# reverse proxy, and uses gulp to be able to change frontend files without 
# having to rebuild the backend.
# 
# @pre
# See `scripts/osx/InstallOsXDependencies.sh`. On linux, you must install a
# simular setup.

set -x
set -e

# Start from the repository root
previousDir=$(pwd)
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

# Build Frontend & install local dependencies (req. by C++ plugin)
cd frontend/
npm install
git checkout node_modules/gulp-injectInlineWorker/index.js
bower install
gulp build
cd ../

# Build plugin
./backend/scripts/buildLocally.sh

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

# Return to the previous folder
cd previousDir