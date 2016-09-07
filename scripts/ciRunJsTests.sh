#!/bin/bash

# Requires ciPrepareTests.sh to be called

# Handle errors
source scripts/ciErrorHandler.sh

source scripts/setBuildVariables.sh

# Run js tests
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/tests/
export releaseCommitId # make releaseCommitId available to docker-compose
docker-compose -f docker-compose.yml -p wv_test up --abort-on-container-exit --no-recreate test_js # --no-recreate because of ciPrepareTests.sh

# Exit on docker-compose failure
# see http://blog.ministryofprogramming.com/docker-compose-and-exit-codes/
docker-compose -f docker-compose.yml -p wv_test ps -q | xargs docker inspect -f '{{ .State.ExitCode }}' | while read code; do  
    if [ "$code" != "0" ]; then
       exit $code
    fi
done