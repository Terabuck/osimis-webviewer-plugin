#!/bin/bash

# @description
# Build the backend source code locally as a debuggable executable using cmake.
#
# @pre
# If `frontend/build` does not exist,
# 
# - Build frontend via `./scripts/ciBuildFrontend.sh ...`
# - Publish frontend via `./scripts/ciPushFrontend.sh ...`

set -x
set -e

# Define the backend path
prevPath=$(pwd)
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
backendRoot="${srcRoot}/backend"
buildDir="${backendRoot}/build"

# Create `build/` dir if unvailable
mkdir ${buildDir} || true

# Generate dev build
cd ${buildDir}
cmake ${backendRoot} -DCMAKE_BUILD_TYPE=Debug -DALLOW_DOWNLOADS=ON -DSTANDALONE_BUILD=ON -DSTATIC_BUILD=ON

# Build C++
make -j2

# Return to previous dir
cd ${prevPath}