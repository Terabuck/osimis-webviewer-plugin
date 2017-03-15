#!/bin/bash
# Run C++ unit tests.
#
# pre-condition: setEnv.sh must be called
#                ciPrepareTests.sh must be called

# Handle errors
source .env
source $SRC_ROOT/scripts/ci/ciErrorHandler.sh

# Run cpp tests
docker-compose -f $TEST_COMPOSE_FILE -p $TEST_COMPOSE_PROJECT up --abort-on-container-exit --no-recreate test_cpp # --no-recreate because of ciPrepareTests.sh

# Exit on docker-compose failure
# see http://blog.ministryofprogramming.com/docker-compose-and-exit-codes/
docker-compose -f $TEST_COMPOSE_FILE -p $TEST_COMPOSE_PROJECT ps -q | xargs docker inspect -f '{{ .State.ExitCode }}' | while read code; do  
    if [ "$code" != "0" ]; then    
       exit $code
    fi
done
