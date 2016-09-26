#!/bin/bash
# Create an orthanc container with specific configuratoin
# and install unit test dependencies.
#
# pre-condition: setEnv.sh must be called

# Handle errors
source .env
source $SRC_ROOT/scripts/ciErrorHandler.sh

# Create a webviewer docker image with the right configuration (~ authentication disabled)
echo "Prepare testable orthanc image.."
testedContainerId=$(docker create --name $TEST_TMP_CONTAINER $MAIN_IMAGE:$TAG)
docker cp $TEST_CONFIG $testedContainerId:/etc/orthanc/orthanc.json > /dev/null
docker commit $testedContainerId $TEST_IMAGE:$TAG > /dev/null
docker rm -v $testedContainerId > /dev/null

# Prepare unit tests
echo "Prepare karma unit test environment.."
echo "Create network ${TEST_NETWORK}"
docker network create ${TEST_NETWORK} --subnet=10.0.0.0/29 || true # manual network create, see https://github.com/docker/compose/issues/3068 (also, limit to 4 ips / class A)
docker-compose -f $TEST_COMPOSE_FILE -p $TEST_COMPOSE_PROJECT create --build # do not use --force-recreate (invalidate images cache - not stated in doc)
