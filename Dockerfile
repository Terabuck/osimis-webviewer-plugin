# This docker file builds the backend, not the frontend (the frontend build is downloaded to be embedded if not available).
# The CI generates the frontend build, uploads it to aws and then builds this dockerfile.

FROM jodogne/orthanc-plugins:1.1.0

RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev git; rm -rf /var/lib/apt/lists/*

# Copy everything required to configure the project and build GDCM
COPY ./backend/Orthanc/ /root/osimis-webviewer/backend/Orthanc/
COPY ./backend/Resources/ /root/osimis-webviewer/backend/Resources/
COPY ./backend/Dependencies/ /root/osimis-webviewer/backend/Dependencies/
COPY ./backend/CMakeLists.txt /root/osimis-webviewer/backend/

# Download, configure & build third parties
RUN cd /root/osimis-webviewer/backend && \
    mkdir Build && cd Build && \
    cmake -DALLOW_DOWNLOADS:BOOL=ON \
    -DCMAKE_BUILD_TYPE:STRING=Release \
    -DUSE_GTEST_DEBIAN_SOURCE_PACKAGE:BOOL=ON \
    -DUSE_SYSTEM_JSONCPP:BOOL=OFF \
    -DBUILD_INTERMEDIATE_TARGETS:BOOL=OFF \
    -DBUILD_FINAL_TARGETS:BOOL=OFF \
    .. && \
    make GDCM && \
    make WebViewerDependencies

# Copy everything required to build the intermediate library
COPY ./backend/WebViewerLibrary/ /root/osimis-webviewer/backend/WebViewerLibrary/

# Rerun cmake with intermediate targets
RUN cd /root/osimis-webviewer/backend/Build && \
    cmake -DALLOW_DOWNLOADS:BOOL=ON \
    -DCMAKE_BUILD_TYPE:STRING=Release \
    -DUSE_GTEST_DEBIAN_SOURCE_PACKAGE:BOOL=ON \
    -DUSE_SYSTEM_JSONCPP:BOOL=OFF \
    -DBUILD_INTERMEDIATE_TARGETS:BOOL=ON \
    -DBUILD_FINAL_TARGETS:BOOL=OFF \
    .. && \
    make WebViewerLibrary

# Copy everything required to build unit tests & the final library (including the .git folder to retrieve tags)
# COPY ./.git/ /root/osimis-webviewer/.git/
# COPY ./backend/WebViewerTests/ /root/osimis-webviewer/backend/WebViewerTests/
# COPY ./backend/WebViewerPlugin/ /root/osimis-webviewer/backend/WebViewerPlugin/
# Copy everything since "-dirty" will be appended to git tag and build will fail if we do not
COPY . /root/osimis-webviewer/

# Rerun cmake with final target (the final dynamic library & the unit tests)
# Build & cache dynamic library with embedded frontend (targets: EmbeddedResourcesGenerator, OsimisWebViewer & UnitTests)
# Remove the build directory to recover space
# Remove the Orthanc viewer to avoid conflicts with the Osimis Viewer (2 buttons to open 2 viewers)
RUN cd /root/osimis-webviewer/backend/Build && \
    cmake -DALLOW_DOWNLOADS:BOOL=ON \
    -DCMAKE_BUILD_TYPE:STRING=Release \
    -DUSE_GTEST_DEBIAN_SOURCE_PACKAGE:BOOL=ON \
    -DUSE_SYSTEM_JSONCPP:BOOL=OFF \
    -DBUILD_INTERMEDIATE_TARGETS:BOOL=ON \
    -DBUILD_FINAL_TARGETS:BOOL=ON \
    .. && \
    make EmbeddedResourcesGenerator && \
    make UnitTests && \
    make OsimisWebViewer && \
    cp -L UnitTests /root/OsimisViewerUnitTests && \
    cp -L libOsimisWebViewer.so /usr/share/orthanc/plugins/ && \
    cd /root/ && \
    rm -rf /root/osimis-webviewer && \
    rm -rf /usr/share/orthanc/plugins/libOrthancWebViewer.so
