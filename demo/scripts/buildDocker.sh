#!/bin/bash
#
# @pre
# builds a demo docker image with the WVB and sample images

set -x
set -e

# Define Dockerfile path
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
cd "${srcRoot}/demo/" # Make sure we're in the demo folder

# instanciate a wvb container to extract the wvb .so
mkdir -p binaries
wvbContainerId=$(docker create osimis/orthanc-webviewer-plugin:latest-local) 
docker cp --follow-link "$wvbContainerId:/usr/share/orthanc/plugins/libOsimisWebViewer.so" binaries/
docker rm $wvbContainerId

# Build demo docker image with latest Orthanc, latest sample data but not yet the wvb .so
docker rmi -f osimis/orthanc-webviewer-plugin/demo:latest-local || true # @todo Use trap to clean image instead
docker build -t osimis/orthanc-webviewer-plugin/demo:latest-local .