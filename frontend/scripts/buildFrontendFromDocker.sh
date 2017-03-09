#!/bin/bash
# builds orthanc JS/HTML from inside the frontend-builder container
set -e
set -x

cd /frontend

gulp build

# at this stage, the output files are in /frontend/build

mkdir -p /tmp/output
ZIP_PATH=/tmp/output/frontend-build.zip
cd /frontend/build
zip -r $ZIP_PATH .