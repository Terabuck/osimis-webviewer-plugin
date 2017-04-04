#!/bin/bash

# @description
# This script builds the viewer plugin, launches orthanc with it, launches a 
# reverse proxy, and uses gulp to be able to change frontend files without 
# having to rebuild the backend.
# 
# @pre
# See `scripts/osx/InstallOsXDependencies.sh`. On linux, you must install a
# simular setup.
# 
# @param {boolean} [$1=true]
# Rebuild backend.

set -x
set -e

# Start from the repository root
previousDir=$(pwd)
rootDir="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
cd ${rootDir}/

if [ "$1" = true ]; then
    # Build Frontend & install local dependencies (req. by C++ plugin)
    cd frontend/
    npm install
    git checkout node_modules/gulp-injectInlineWorker/index.js
    bower install
    gulp build
    cd ../

    # Build plugin
    ./backend/scripts/buildLocally.sh
fi

# Run nginx
nginx -p ${rootDir}/reverse-proxy/ -c nginx.local.conf

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
trap "nginx -p ${rootDir}/reverse-proxy/ -c nginx.local.conf -s stop; kill ${orthancPid}; kill ${gulpPid};" SIGINT ERR
wait

# Return to the previous folder
cd previousDir
