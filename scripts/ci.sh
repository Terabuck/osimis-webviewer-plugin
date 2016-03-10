#!/bin/bash

# this scripts generates the html/js/css output from the sources and pushes the changes into the build_dev/build_master branch
#
# prerequisites:
## install rvm for all users
# gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
# curl -L https://get.rvm.io | sudo bash -s stable
# sudo usermod -G rvm jenkins
# source ~/.rvm/scripts/rvm
# rvm install 2.2.3
# rvm use 2.2.3 --default
# curl -sL https://deb.nodesource.com/setup_5.x | sudo bash -
# sudo apt-get -y install nodejs
#
# gem install compass
#
# # install bower, grunt & grunt-cli
# sudo npm install -g bower gulp nodemon

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

currentBranch=$1
buildDir="build"
buildBranch="build_$currentBranch"

#enter ruby virtual environment
source ~/.rvm/scripts/rvm

cd $startScriptDir/../
npm cache clean # make sure install is fine
npm install

#first run the unit tests
gulp test --novet # --novet disables jshint and jscs

#run gulp build after the unit tests (unit tests seems to clean the gulp build output)
gulp build

npm cache clean

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
GIT_DEPLOY_DIR=$buildDir GIT_DEPLOY_BRANCH=$buildBranch GIT_DEPLOY_REPO=origin ./scripts/deploy.sh

cd $startScriptDir