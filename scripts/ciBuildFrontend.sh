#!/bin/bash
# Build the front-end.
#
# pre-condition: setEnv.sh must be called

# handle errors
source .env
source $SRC_ROOT/scripts/ciErrorHandler.sh

# build the lib
# -------------

#remove libs from previous builds
tmpPwd=$(pwd)
cd $SRC_ROOT/frontend/
rm -f *.zip
rm -rf build/

docker build --tag=$JS_BUILDER_IMAGE --file=DockerfileFrontEndBuilder $SRC_ROOT/frontend/

# we first need to create the container before we can copy files to it
JS_BUILDER_CONTAINER_ID=$(docker create --name $JS_BUILDER_CONTAINER $JS_BUILDER_IMAGE $COMMIT_ID) # Last $COMMIT_ID is the COMMAND of DockerfileFrontEndBuilder
export JS_BUILDER_CONTAINER_ID # export the variable so we can remove the container later

# copy the frontend files in the container
docker cp $(pwd)/ $JS_BUILDER_CONTAINER_ID:/

# run
docker start -a $JS_BUILDER_CONTAINER_ID

# copy the build output folder to the host
docker cp $JS_BUILDER_CONTAINER_ID:/frontend/build/ $SRC_ROOT/frontend/build/

# copy the zip output folder to the host
docker cp $JS_BUILDER_CONTAINER_ID:/tmp/output/$COMMIT_ID.zip $SRC_ROOT/frontend/

# remove container
docker rm -v $JS_BUILDER_CONTAINER_ID > /dev/null

# move back to the previous folder
cd $tmpPwd