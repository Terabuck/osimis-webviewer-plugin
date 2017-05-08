#!/bin/bash

set -x
set -e

previousDir=$(pwd)
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
cd ${srcRoot}

# Start Orthanc Testing
cd tests/osimis-test-runner/
pyvenv env
. env/bin/activate
pip install -r requirements.txt
python3 osimis-test-runner.py -p ../../backend/build/

cd ${previousDir}