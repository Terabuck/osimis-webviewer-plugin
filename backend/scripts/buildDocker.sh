#!/bin/bash

# @description
# Build docker image with name osimis/orthanc-webviewer-plugin:latest-local
# 
# @pre
# If parameter `$3` is not set,
# 
# - Build frontend via `./scripts/ciBuildFrontend.sh ...`
# - Publish frontend via `./scripts/ciPushFrontend.sh ...`
# 
# @param {string} [$1=osimis/orthanc-webviewer-plugin:latest-local]
# Tag of the docker image being built.
# - In CI, we should always use `latest-local` tag to be able to chain 
#   Dockerfile easily, using the FROM instruction (see file `demo/Dockerfile` 
#   for instance).
# - @warning In the CI, this implies to lock the job to a single build at a 
#   time, otherwise we may push a wrong image.
# 
# @param {string} [$2=$(git describe --tags --long --dirty=-dirty)]
# Version of the web viewer (retrieved via `git describe`).
# - For debug purpose, you may use `$(git describe --tags --long dev)` as it 
#   doesn't requires the actual frontend to be built with the current commit.
# - The embedded frontend folder is downloaded from aws via
#   the commit id prescribed in this argument (ie. gea135fa.zip).
# - The webviewer library version is registered in the compiled target
#   via this argument (see `WebViewerPlugin/WebViewerPlugin.cmake` file).
# - @todo Use jenkins artefact and docker copy instead of AWS copy (to reduce
#         complexity, but require >4h work since we need to change non-docker
#         build processes as well).
#                           
# @param {string} [$3]
# Path to the local frontend build folder to embed in the built C++ plugin
# (using a docker volume). It must be set either as an absolute path or
# relative to the source code root folder. If not set (default), the frontend
# is downloaded using aws. 
#                     
# @usage
# CI Mode:
# 
# ```
# $ ./buildDocker.sh
# ```
# 
# @usage
# Debug Mode (use an old frontend folder, to avoid having to rebuild the
# current frontend):
# 
# ```
# $ ./buildDocker.sh osimis/orthanc-webviewer-plugin:latest-local $(git describe --tags --long dev) ../../frontend/build
# ```

set -x
set -e

# Define Dockerfile path
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
backendRoot="${srcRoot}/backend" # Make sure we're in the backend folder
frontendBuildPath=${3}

# $1 Name of the docker image
dockerImageName=${1:-"osimis/orthanc-webviewer-plugin:latest-local"}

# $2 Viewer version
viewerVersion=${2:-$(git describe --tags --long --dirty=-dirty)}

# Build docker image 
if [ -z "$frontendBuildPath" ]; then
    # Build docker image and embed the frontend build as downloaded from AWS.
    docker build -t ${dockerImageName} --build-arg VIEWER_VERSION=${viewerVersion} ${backendRoot}/;
else
    # Build docker image and embed the frontend build as specified in the local
    # frontend build folder parameter.
    
    # Copy frontend build folder in the docker environment
    cp -r ${frontendBuildPath} ${backendRoot}/tmpFrontendBuild

    # Copy Dockerfile and append a shell line to copy the frontend folder to 
    # the docker environment at line 52.
    # @warning this will break everytime the Dockerfile changes
    cp ${backendRoot}/Dockerfile ${backendRoot}/tmpDockerfile
    if [ "$(uname)" == "Darwin" ]; then
        sed -i '' '52i\
        COPY ./tmpFrontendBuild/ /root/osimis-webviewer/frontend/build/
        ' ${backendRoot}/tmpDockerfile;
    else
        sed -i '52i\
        COPY ./tmpFrontendBuild/ /root/osimis-webviewer/frontend/build/
        ' ${backendRoot}/tmpDockerfile;
    fi

    # Build the backend docker image
    docker build -t ${dockerImageName} -f ${backendRoot}/tmpDockerfile --build-arg VIEWER_VERSION=${viewerVersion} ${backendRoot}/;

    # Clean up mess
    rm ${backendRoot}/tmpDockerfile
    rm -r ${backendRoot}/tmpFrontendBuild
fi
