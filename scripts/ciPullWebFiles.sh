#!/bin/bash

# this scripts pull the subtree osimis-webviewer/build_{dev|master} branch
# 
# prerequisites:

# ci url
#	http://jenkins.osidev.net:8080/
# ci debug
# 	ssh -i jenkins_master ubuntu@jenkins.osidev.net
# 	sudo su jenkins
# 	cd 
# 	cd jobs/osimisWebViewerPluginPullWebFiles_dev/workspace/scripts

set -e #to exit script at first command failure
set -x #to debug the script

startScriptDir=$(pwd)

currentBranch=$1
buildDir="subtrees/webViewer.git/"
buildRemote="webViewer"
buildBranch="build_$currentBranch"

git subtree pull --squash --prefix $buildDir $buildRemote $buildBranch

cd $startScriptDir
