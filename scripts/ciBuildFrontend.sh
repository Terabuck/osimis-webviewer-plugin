#!/bin/bash
set -e
set -x

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

source scripts/setBuildVariables.sh

# build the lib
# -------------
cd frontend/

#remove libs from previous builds
rm *.zip

docker build --tag=osimis/frontend-builder --file=DockerfileFrontEndBuilder .

# we first need to create the container before we can copy files to it
export releaseCommitId
webAppBuilderContainerId=$(docker create --name webviewer-frontend-builder osimis/frontend-builder $releaseCommitId)

# copy the frontendToolbox files in the container
docker cp $(pwd)/ $webAppBuilderContainerId:/

# run
docker start -a $webAppBuilderContainerId

# copy the build output folder to the host
docker cp $webAppBuilderContainerId:/frontend/build/ $(pwd)/build/

# copy the zip output folder to the host
docker cp $webAppBuilderContainerId:/tmp/output/$releaseCommitId.zip $(pwd)/

# remove container
docker rm $webAppBuilderContainerId