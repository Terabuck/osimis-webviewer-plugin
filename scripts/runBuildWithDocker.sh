#!/bin/bash

# @warning script should be launched from the osimis-webviewer root

set -e #to exit script at first command failure
set -x #to debug the script

echo "build wv dependencies"
docker build --rm -t wv_build:latest ./docker/build/

echo "build wv"
# ! script should be launched from the osimis-webviewer root
currentScript=$(pwd)
docker run --rm -v $currentScript:/buildApp wv_build bash -c 'cd /buildApp && ./scripts/runBuildLocally.sh'
