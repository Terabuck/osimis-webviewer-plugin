#!/bin/bash
#
# Build docker image with name osimis/orthanc-webviewer-plugin:latest-local
# 
# @pre Build frontend via `./scripts/ciBuildFrontend.sh ...`
# @pre Publish frontend via `./scripts/ciPushFrontend.sh ...`
# 
# @param {string} $1 Tag of the docker image being built.
#                    Default: `osimis/orthanc-webviewer-plugin:latest-local`
#                    - In CI, we should always use `latest-local` tag to be able to chain Dockerfile
#                      easily, using the FROM instruction (see file `demo/Dockerfile` for
#                      instance).
#                    - @warning In the CI, this implies to lock the job to a single build at a time,
#                      otherwise we may push a wrong image.
# 
# @param {string} $2 Version of the web viewer (retrieved via `git describe`).
#                    Default: `$(git describe --tags --long --dirty=-dirty)`
#                    - For debug purpose, you may use `$(git describe --tags --long dev)` as it doesn't
#                      requires the actual frontend to be built with the current commit.
#                    - The embedded frontend folder is downloaded from aws via
#                      the commit id prescribed in this argument (ie. gea135fa.zip).
#                    - The webviewer library version is registered in the compiled target
#                      via this argument (see `WebViewerPlugin/WebViewerPlugin.cmake` file).
#                    @todo Use jenkins artefact and docker copy instead of AWS copy (to reduce
#                          complexity, but require >4h work since we need to change non-docker
#                          build processes as well).
#                    
# @usage CI mode
# 
# ```
# $ ./buildDocker.sh
# ```
# 
# @usage debug mode (use an old frontend folder, to avoid having to rebuild the current frontend)
# 
# ```
# $ ./buildDocker.sh osimis/orthanc-webviewer-plugin:latest-local $(git describe --tags --long dev)
# ```

set -x
set -e

# Define Dockerfile path
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
backendRoot="${srcRoot}/backend/" # Make sure we're in the backend folder

# $1 Name of the docker image
dockerImageName=${1:-"osimis/orthanc-webviewer-plugin:latest-local"}

# $2 Viewer version
viewerVersion=${2:-$(git describe --tags --long --dirty=-dirty)}

# Build docker image
docker build -t ${dockerImageName} --build-arg VIEWER_VERSION=${viewerVersion} ${backendRoot}