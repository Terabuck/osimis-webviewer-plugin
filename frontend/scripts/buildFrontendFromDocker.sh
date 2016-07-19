#!/bin/bash
# builds orthanc JS/HTML from inside the frontend-builder container
set -e
set -x

releaseCommitId=${1:-0000000}  #get the commitId number from the first argument (default to 0000000)

cd /frontend

gulp build

# at this stage, the output files are in /frontend/build

mkdir -p /tmp/output
ZIP_PATH=/tmp/output/$releaseCommitId.zip
cd /frontend/build
zip -r $ZIP_PATH .