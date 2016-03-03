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

set -e #to exit script at first command failure
set -x #to debug the script

startScriptDir=$(pwd)

currentBranch=$1
buildBranch="build_$currentBranch"

source ~/.rvm/scripts/rvm

cd $startScriptDir/../
npm install --unsafe-perm # note unsafe indeed
gulp build
npm cache clean

cd $startScriptDir
