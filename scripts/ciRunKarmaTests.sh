#!/bin/bash

#start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

# handle errors
source scripts/ciErrorHandler.sh

source scripts/setBuildVariables.sh

# run tests
export releaseCommitId # make releaseCommitId available to docker-compose
docker-compose -f tests/docker-compose.yml -p wv_tests up --abort-on-container-exit tests

# exit on docker-compose failure
# see http://blog.ministryofprogramming.com/docker-compose-and-exit-codes/
docker-compose -f tests/docker-compose.yml -p wv_tests ps -q | xargs docker inspect -f '{{ .State.ExitCode }}' | while read code; do  
    if [ "$code" != "0" ]; then    
       exit $code
    fi
done  

# clean related images
docker-compose -p wv_tests down --rmi all --volumes || true
