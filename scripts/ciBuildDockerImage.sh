#!/bin/bash
# This script builds the osimis/orthanc-webviewer-plugin docker image and
# pushes it to DockerHub.  You must be logged in DockerHub before it runs.
#
# pre-condition: setEnv.sh must be called

# handle errors
source .env
source $SRC_ROOT/scripts/ciErrorHandler.sh

# build the image
docker build -t $MAIN_IMAGE:$TAG $SRC_ROOT