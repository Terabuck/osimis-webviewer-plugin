#!/bin/bash
# Clean the docker environment.
#
# pre-condition: setEnv.sh must be called

source .env
set -e # exit on error (and avoid recursive call to errorHandler in ciErrorHandler) - this should never happen during cleanup phase

echo "------------------------"
echo "Cleaning up..."

# cleanup osimis/orthanc-webviewer-plugin related images
dockerImage=$(docker images -q $MAIN_IMAGE:$COMMIT_ID 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $MAIN_IMAGE:$COMMIT_ID"
	docker rmi $MAIN_IMAGE:$COMMIT_ID > /dev/null
fi

dockerImage=$(docker images -q $MAIN_IMAGE:$RELEASE_TAG 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $MAIN_IMAGE:$RELEASE_TAG"
	docker rmi $MAIN_IMAGE:$RELEASE_TAG > /dev/null
fi

dockerImage=$(docker images -q $MAIN_IMAGE:latest 2> /dev/null)
if [[ $dockerImage != "" ]]; then
	echo "Cleaning $MAIN_IMAGE:latest"
	docker rmi $MAIN_IMAGE:latest > /dev/null
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
if [[ "${JS_BUILDER_CONTAINER_ID}" != "" ]]; then
	dockerContainer=$(docker ps -a -q --no-trunc | grep ${JS_BUILDER_CONTAINER_ID} 2> /dev/null)
	if [[ $dockerContainer != "" ]]; then
		echo "Cleaning $dockerContainer (JS_BUILDER_CONTAINER_ID)"
		docker rm -v $dockerContainer > /dev/null
	fi
fi

# remove test runner docker container if exists
echo "Cleaning $TEST_COMPOSE_PROJECT docker compose project"
tmpPwd=$(pwd)
cd ${SRC_ROOT}/tests/
export COMMIT_ID # make COMMIT_ID available to docker-compose
# docker network rm wvtest_default > /dev/null
docker-compose -p $TEST_COMPOSE_PROJECT down --rmi all --volumes > /dev/null
# move back to the previous folder
cd $tmpPwd

testedImage=${TEST_IMAGE}:${COMMIT_ID}
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