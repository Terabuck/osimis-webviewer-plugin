#!/bin/bash

set -e

# install git & nodejs
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -y install curl git
curl -sL https://deb.nodesource.com/setup_5.x | sudo bash -
DEBIAN_FRONTEND=noninteractive apt-get -y install nodejs
rm -rf /var/lib/apt/lists/*

# install compass (with ruby)
gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
curl -L https://raw.githubusercontent.com/wayneeseguin/rvm/master/binscripts/rvm-installer | bash -s stable --ruby 
source /etc/profile.d/rvm.sh
rvm use default

gem install compass

# install bower, grunt & grunt-cli
npm install -g bower grunt grunt-cli