#!/bin/bash

set -e
set -x

cd /root/osimis-webviewer/

# write relative orthanc url path in config.js
echo "window.orthancUrl = '../../'" > subtrees/webViewer.git/config.js

cd /root/