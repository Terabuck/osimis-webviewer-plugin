#!/bin/bash

# @description
# This script builds the viewer plugin, launches orthanc with it, launches a 
# reverse proxy, and uses gulp to be able to change frontend files without 
# having to rebuild the backend.
# 
# The testable page is located at: `http://127.0.0.1:9966/`
# 
# @pre
# See `scripts/osx/InstallOsXDependencies.sh`. On linux, you must install a
# simular setup.
# 
# @post
# See `scripts/unix/installAdditionalDevTools.sh`. 
#
# @warning
# You have to install additional dev tools (see `@post` section) after
# launching `startUnixDev.sh` and then rerun the `startUnixDev.sh` command with
# the $1 parameter set to false, as `npm install` will remove the additional
# dependencies.
# 
# @param {boolean} [$1=true]
# Reinstall frontend dependencies.
# 
# @param {boolean} [$1=true]
# Rebuild backend.

set -x
set -e

reinstallFrontendDep=${1:-true}
rebuildBackend=${2:-true}

# Start from the repository root
previousDir=$(pwd)
rootDir="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
cd ${rootDir}/

if [ "$reinstallFrontendDep" = true ]; then
    # install frontend local dependencies
    cd frontend/
    npm install
    bower install
    cd ../
fi
if [ "$rebuildBackend" = true ]; then
    # Build Frontend (req. by C++ plugin)
    cd frontend/
    git checkout node_modules/gulp-injectInlineWorker/index.js
    gulp build
    cd ../
    # Build plugin
    ./backend/scripts/buildLocally.sh
fi

# Run nginx
nginx -p ${rootDir}/reverse-proxy/ -c nginx.local.conf

# Run Frontend Dev Process
cd frontend/
git checkout node_modules/gulp-injectInlineWorker/index.js
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
