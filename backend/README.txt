Build instructions for Ubuntu 18.04
===================================

Here are full instructions to build the Osimis Web viewer plugin from
the sources in this folder:


$ git clone https://bitbucket.org/osimis/osimis-webviewer-plugin.git
$ cd osimis-webviewer-plugin/
$ git fetch --all && git pull
$ git checkout 1.4.0
$ mkdir backend/build
$ cd backend/build/
$ cmake .. -DCMAKE_BUILD_TYPE=Debug -DSTANDALONE_BUILD=ON \
        -DVIEWER_VERSION_FULL=1.4.0 -DJS_CLIENT_PATH=`pwd`/frontend-build \
        -DORTHANC_FRAMEWORK_VERSION=1.6.1 -DORTHANC_FRAMEWORK_SOURCE=web
$ make


IMPORTANT:

1- The Osimis Web viewer is *not* currently compatible with Orthanc
   framework >= 1.7.0, because the GDCM plugin was migrated as a
   separate project after 1.6.1. Make sure to set
   "-DORTHANC_FRAMEWORK_VERSION=1.6.1" for this reason.

2- The instructions above do *not* build the front-end (CSS and
   JavaScript) whose source code can be found in
   "../frontend". Precompiled front-end will automatically be
   downloaded from:
   http://orthanc.osimis.io/public/osimisWebViewer/1.4.0.zip
