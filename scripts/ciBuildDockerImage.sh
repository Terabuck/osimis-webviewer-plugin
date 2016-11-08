#!/bin/bash
# This script builds the osimis/orthanc-webviewer-plugin docker image.
#
# @pre `setEnv.sh` must be called
# 
# @param {string} $1 Tag of the docker image being built.
#                    Default: `osimis/orthanc-webviewer-plugin:latest-local`
#                    - In CI, we should always use `latest-local` tag to be able to chain Dockerfile
#                      easily, using the FROM instruction (see file `demo/Dockerfile` for
#                      instance).
#                    - @warning In the CI, this implies to lock the job to a single build at a time,
#                      otherwise we may push a wrong image.

# handle errors
source .env
source $SRC_ROOT/scripts/ciErrorHandler.sh

# $1 Name of the docker image
dockerImageName=${1:-"osimis/orthanc-webviewer-plugin:latest-local"}

# build the image
${SRC_ROOT}/backend/scripts/buildDocker.sh

# tag the image
docker tag $dockerImageName $MAIN_IMAGE:$TAG
docker tag $dockerImageName $MAIN_IMAGE:$COMMIT_ID
docker tag $dockerImageName $MAIN_IMAGE:$RELEASE_TAG
if [[ $BRANCH_NAME == "master" ]]; then
	docker tag $dockerImageName $MAIN_IMAGE:latest
fi
