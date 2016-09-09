#!/bin/bash

# Handle errors
source scripts/ciErrorHandler.sh

source scripts/setBuildVariables.sh
testedImage=${imageName}/test:${releaseCommitId}
testedOrthancConfig=scripts/ciOrthancTestConfig.json

# Create a webviewer docker image with the right configuration (no authentification)
echo 'Prepare testable orthanc image..'
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/
testedContainer=$(docker create --name tested-webviewer-plugin-$releaseCommitId osimis/orthanc-webviewer-plugin:$releaseCommitId)
docker cp $testedOrthancConfig $testedContainer:/etc/orthanc/orthanc.json > /dev/null
docker commit $testedContainer $testedImage > /dev/null
docker rm -v $testedContainer > /dev/null

# Prepare unit tests
echo 'Prepare karma unit test environment..'
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/tests/
export releaseCommitId # make releaseCommitId available to docker-compose
docker network create wvtest_default || true # see https://github.com/docker/compose/issues/3068
docker-compose -f docker-compose.yml -p wv_test create --build # do not use --force-recreate (invalidate images cache - not stated in doc)
