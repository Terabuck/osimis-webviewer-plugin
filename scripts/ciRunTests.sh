#!/bin/bash

#start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

# handle errors
source scripts/ciErrorHandler.sh

source scripts/setBuildVariables.sh

# run cpp tests
export releaseCommitId # make releaseCommitId available to docker-compose
docker-compose -f tests/docker-compose.yml -p wv_test_cpp up --abort-on-container-exit test_cpp

# exit on docker-compose failure
# see http://blog.ministryofprogramming.com/docker-compose-and-exit-codes/
docker-compose -f tests/docker-compose.yml -p wv_test_cpp ps -q | xargs docker inspect -f '{{ .State.ExitCode }}' | while read code; do  
    if [ "$code" != "0" ]; then    
       exit $code
    fi
done  

# run js tests
docker-compose -f tests/docker-compose.yml -p wv_test_js up --abort-on-container-exit test_js

# exit on docker-compose failure
docker-compose -f tests/docker-compose.yml -p wv_test_js ps -q | xargs docker inspect -f '{{ .State.ExitCode }}' | while read code; do  
    if [ "$code" != "0" ]; then    
       exit $code
    fi
done  

# clean related images
docker-compose -p wv_test_cpp down --rmi all --volumes || true
docker-compose -p wv_test_js down --rmi all --volumes || true
