#!/bin/bash
# builds orthanc from inside the docker container
set -e
set -x


# Get the number of available cores to speed up the builds
COUNT_CORES=`grep -c ^processor /proc/cpuinfo`
echo "Will use $COUNT_CORES parallel jobs to build Orthanc"

cd /root/osimis-webviewer/backend

# Build the plugin
mkdir Build
cd Build
cmake -DALLOW_DOWNLOADS:BOOL=ON \
    -DCMAKE_BUILD_TYPE:STRING=Release \
    -DUSE_GTEST_DEBIAN_SOURCE_PACKAGE:BOOL=ON \
    -DUSE_SYSTEM_JSONCPP:BOOL=OFF \
    ..

git status
make -j$COUNT_CORES
cp -L UnitTests /root/OsimisViewerUnitTests
cp -L libOsimisWebViewer.so /usr/share/orthanc/plugins/

# Remove the build directory to recover space
cd /root/
rm -rf /root/osimis-webviewer

# Remove the Orthanc viewer to avoid conflicts with the Osimis Viewer (2 buttons to open 2 viewers)
rm -rf /usr/share/orthanc/plugins/libOrthancWebViewer.so
