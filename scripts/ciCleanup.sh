#!/bin/bash

set -e # exit on error (and avoid recursive call to errorHandler in ciErrorHandler) - this should never happen during cleanup phase

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

source scripts/setBuildVariables.sh

echo "------------------------"
echo "Cleaning up..."

# cleanup osimis/orthanc-webviewer-plugin related images
dockerImage=$(docker images -q $imageName:$releaseCommitId 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $imageName:$releaseCommitId"
	docker rmi $imageName:$releaseCommitId > /dev/null
fi

dockerImage=$(docker images -q $imageName:$releaseTag 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $imageName:$releaseTag"
	docker rmi $imageName:$releaseTag > /dev/null
fi

dockerImage=$(docker images -q $imageName:latest 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $imageName:latest"
	docker rmi $imageName:latest > /dev/null
fi

# remove aws docker container if exists
if [[ "${AWS_DOCKER_CONTAINER_ID}" != "" ]]; then
	dockerContainer=$(docker ps -a -q --no-trunc | grep ${AWS_DOCKER_CONTAINER_ID} 2> /dev/null)
	if [[ $dockerContainer != "" ]]; then
		echo "Cleaning $dockerContainer (AWS_DOCKER_CONTAINER_ID)"
		docker rm -v $dockerContainer > /dev/null
	fi
fi

# remove webapp builder docker container if exists
if [[ "${WEBAPP_BUILDER_CONTAINER_ID}" != "" ]]; then
	dockerContainer=$(docker ps -a -q --no-trunc | grep ${WEBAPP_BUILDER_CONTAINER_ID} 2> /dev/null)
	if [[ $dockerContainer != "" ]]; then
		echo "Cleaning $dockerContainer (WEBAPP_BUILDER_CONTAINER_ID)"
		docker rm -v $dockerContainer > /dev/null
	fi
fi

# remove test runner docker container if exists
echo "Cleaning wv_test_cpp and wv_test_js"
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/tests/
export releaseCommitId # make releaseCommitId available to docker-compose
# docker network rm wvtest_default > /dev/null
docker-compose -p wv_test down --rmi all --volumes > /dev/null
cd ..

testedImage=${imageName}/test:${releaseCommitId}
dockerImage=$(docker images -q $testedImage 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $testedImage"
	docker rmi $testedImage > /dev/null
fi

echo "...cleaned up"

echo "------------------------"
echo "Cleanup After Status:"

./scripts/ciLogDockerState.sh postclean
echo "+ images"
diff --ignore-all-space /tmp/wv-docker-images-prebuild.txt /tmp/wv-docker-images-postclean.txt || true
echo "+ containers"
diff --ignore-all-space /tmp/wv-docker-ps-prebuild.txt /tmp/wv-docker-ps-postclean.txt || true
echo "+ volumes"
diff --ignore-all-space /tmp/wv-docker-volumes-prebuild.txt /tmp/wv-docker-volumes-postclean.txt || true
echo "+ networks"
diff --ignore-all-space /tmp/wv-docker-networks-prebuild.txt /tmp/wv-docker-networks-postclean.txt || true