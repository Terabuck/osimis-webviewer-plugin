#!/bin/bash

set -x # debug mode
set -e # exit on error (and avoid recursive call to errorHandler in ciErrorHandler) - this should never happen during cleanup phase

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

source scripts/setBuildVariables.sh

echo "Cleaning up..."

# cleanup osimis/orthanc-webviewer-plugin related images & containers
dockerImage=$(docker images -q $imageName:$releaseCommitId 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	docker rmi $imageName:$releaseCommitId
fi

dockerImage=$(docker images -q $imageName:$releaseTag 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	docker rmi $imageName:$releaseTag
fi

dockerImage=$(docker images -q $imageName:latest 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	docker rmi $imageName:latest
fi

# remove aws docker container if exists
if [[ "${AWS_DOCKER_CONTAINER_ID}" != "" ]]; then
	dockerContainer=$(docker ps -a -q --no-trunc | grep ${AWS_DOCKER_CONTAINER_ID} 2> /dev/null)
	if [[ $dockerContainer != "" ]]; then
		docker rm $dockerContainer
	fi
fi

echo "...cleaned up"