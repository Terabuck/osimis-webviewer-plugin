#!/bin/bash

set -e

source /etc/profile.d/rvm.sh

cd /root/osimis-webviewer/OsimisWebApplication
npm install
bower install --allow-root
# npm test
grunt build
npm cache clean

cd /root/
