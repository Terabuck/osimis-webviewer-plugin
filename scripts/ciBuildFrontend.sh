#!/bin/bash
set -e
set -x

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

# handle errors
source scripts/ciErrorHandler.sh

source scripts/setBuildVariables.sh

# build the lib
# -------------
cd frontend/

#remove libs from previous builds
rm -f *.zip
rm -rf build/

docker build --tag=osimis/frontend-builder --file=DockerfileFrontEndBuilder .

# we first need to create the container before we can copy files to it
export releaseCommitId
WEBAPP_BUILDER_CONTAINER_ID=$(docker create --name webviewer-frontend-builder-$releaseCommitId osimis/frontend-builder $releaseCommitId)
export WEBAPP_BUILDER_CONTAINER_ID # export the variable to be able to remove the container later in case of error

# copy the frontend files in the container
docker cp $(pwd)/ $WEBAPP_BUILDER_CONTAINER_ID:/

# run
docker start -a $WEBAPP_BUILDER_CONTAINER_ID

# copy the build output folder to the host
docker cp $WEBAPP_BUILDER_CONTAINER_ID:/frontend/build/ $(pwd)/build/

# copy the zip output folder to the host
docker cp $WEBAPP_BUILDER_CONTAINER_ID:/tmp/output/$releaseCommitId.zip $(pwd)/

# remove container
docker rm $WEBAPP_BUILDER_CONTAINER_ID