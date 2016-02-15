#!/bin/bash

set -e

source /etc/profile.d/rvm.sh

cd /root/osimis-webviewer/subtrees/webViewer.git
npm install --unsafe-perm # note unsafe indeed
# bower install --allow-root # called by npm install posthook
# npm test
gulp build
npm cache clean

cd /root/
