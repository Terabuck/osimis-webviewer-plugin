#!/bin/bash
# This script pushed the osimis/orthanc-webviewer-plugin docker image to DockerHub.
# You must be logged in DockerHub before it runs.
#
# pre-condition: setEnv.sh must be called

# handle errors
source .env
source $SRC_ROOT/scripts/ciErrorHandler.sh

# push to docker hub (with the commit Id)
docker tag $MAIN_IMAGE:$TAG $MAIN_IMAGE:$COMMIT_ID
docker push $MAIN_IMAGE:$COMMIT_ID

# push to docker hub (with the branch name)
docker tag $MAIN_IMAGE:$TAG $MAIN_IMAGE:$RELEASE_TAG
docker push $MAIN_IMAGE:$RELEASE_TAG

# if in master branch, the current tag should also be marked as the latest
if [[ $branchName == "master" ]]; then
	docker tag $MAIN_IMAGE:$TAG $MAIN_IMAGE:latest
	docker push $MAIN_IMAGE:latest
fi

echo '------------------------'
echo 'Docker images uploaded.'
echo 'Orthanc & Web Viewer Plugin can be installed via:'
echo '$ docker pull '$MAIN_IMAGE':'$COMMIT_ID
echo '$ docker pull '$MAIN_IMAGE':'$RELEASE_TAG
if [[ $branchName == "master" ]]; then
echo '$ docker pull '$MAIN_IMAGE':latest'
fi
echo '------------------------'
