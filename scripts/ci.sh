#!/bin/bash

# this scripts generates the html/js/css output from the sources and pushes the changes into the build_dev/build_master branch

# ci url
#       http://jenkins.osidev.net:8080/
# ci debug
#       ssh -i jenkins_master ubuntu@jenkins.osidev.net
#       sudo su jenkins
#       cd
#       cd jobs/osimisWebViewerWebFiles_dev/workspace/scripts

set -e #to exit script at first command failure
set -x #to debug the script


startScriptDir=$(pwd)
cd $startScriptDir/../


./scripts/runBuildWithDocker.sh


#make sure an output has actually been generated (only the most important ones, we assume other files will generated too)

if [ ! -f build/index.html ]; then
  echo "index.html no found"
  exit 1
fi
if [ ! -f build/js/app.js ]; then
  echo "app.js no found"
  exit 1
fi
if [ ! -f build/plugin-entrypoint.html ]; then
  echo "plugin-entrypoint.html no found"
  exit 1
fi


echo "pushing to $buildBranch"

#push the gulp output to the buildBranch
currentBranch=$1
buildDir="build"
buildBranch="build_$currentBranch"

GIT_DEPLOY_DIR=$buildDir GIT_DEPLOY_BRANCH=$buildBranch GIT_DEPLOY_REPO=origin ./scripts/deploy.sh


cd $startScriptDir