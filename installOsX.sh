#!/bin/bash

# @pre
# Install xcode using apple store

# Install xcode CLI tools (ruby dependency)
xcode-select --install

# Install homebrew
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# Frontend:
#   Install Ruby
brew install rbenv ruby-build
echo 'if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi' >> ~/.bash_profile
source ~/.bash_profile
rbenv install 2.4.0
rbenv global 2.4.0
ruby -v
#   Install Compass
gem update --system
gem install -n /usr/local/bin compass
#   Install node 6.10
curl -L https://git.io/n-install | bash
. ~/.bash_profile
n 6.10
#   Install frontend global dev dependencies
npm install -g bower gulp
npm install -g nodemon marked jsonlint jshint eslint jscs phantomjs protractor karma-cli
webdriver-manager update

# Backend:
#   Download/Copy orthanc
mkdir backend/build/ || true
cd backend/build/
brew install wget # Install wget
wget http://orthanc.osimis.io/osx/stable/orthancAndPluginsOSX.stable.zip
unzip orthancAndPluginsOSX.stable.zip
rm orthancAndPluginsOSX.stable.zip readme.txt libModalityWorklists.dylib libOrthancDicomWeb.dylib libOrthancPostgreSQLIndex.dylib libOrthancPostgreSQLStorage.dylib libOsimisWebViewer.dylib libServeFolders.dylib 
cd ../../

# Proxy:
#   Install nginx
brew install nginx

# @todo Preinstall images