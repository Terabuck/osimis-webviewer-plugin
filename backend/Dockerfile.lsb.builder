FROM ubuntu:18.04

RUN apt-get -y clean && apt-get -y update
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install wget nano build-essential unzip cmake mercurial uuid-dev libcurl4-openssl-dev liblua5.1-0-dev libgtest-dev libpng-dev libsqlite3-dev libssl-dev libjpeg-dev zlib1g-dev libdcmtk2-dev libboost-all-dev libwrap0-dev libcharls-dev libjsoncpp-dev libpugixml-dev && apt-get clean && rm -rf /var/lib/apt/lists/*

# install LSB-SDK
RUN mkdir /Downloads
WORKDIR /Downloads
RUN wget https://ftp.linuxbase.org/pub/lsb/bundles/released-5.0.0/sdk/lsb-sdk-5.0.0-3.x86_64.tar.gz
# cd ~/Downloads
# wget https://ftp.linuxbase.org/pub/lsb/bundles/released-5.0.0/sdk/lsb-sdk-5.0.0-3.x86_64.tar.gz
RUN tar xvf lsb-sdk-5.0.0-3.x86_64.tar.gz
WORKDIR /Downloads/lsb-sdk/

RUN apt-get -y clean && apt-get -y update
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install alien g++-4.8
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install lsb

# instead of running ./install.sh that requires some input from the user, we have exploded the script:
RUN alien -ick lsb-build-base-5.0.5-3.x86_64.rpm
RUN alien -ick lsb-build-c++-5.0.0-1.x86_64.rpm
RUN alien -ick lsb-build-cc-5.0.5-3.x86_64.rpm
RUN alien -ick lsb-build-desktop-5.0.5-3.x86_64.rpm
RUN alien -ick lsb-build-qt3-5.0.0-1.x86_64.rpm
RUN alien -ick lsb-build-qt4-5.0.0-1.x86_64.rpm
RUN alien -ick lsb-makelsbpkg-5.0.0-1.x86_64.rpm
RUN alien -ick lsb-runner-5.0.5-3.x86_64.rpm
RUN alien -ick lsb-setup-4.1.0-1.noarch.rpm
RUN alien -ick lsb-task-sdk-5.0.0-3.noarch.rpm
RUN alien -ick lsb-xdg-utils-4.0.0-2.x86_64.rpm

RUN mkdir /src
RUN mkdir /build
RUN mkdir /frontend

COPY . /src

ARG JS_FRONTEND_VERSION=dev
WORKDIR /frontend
RUN wget http://orthanc.osimis.io/public/osimisWebViewer/$JS_FRONTEND_VERSION.zip -O /tmp/frontend.zip
RUN unzip /tmp/frontend.zip -d /frontend

RUN ls -al /frontend
WORKDIR /build

RUN LSB_CC=gcc-4.8 LSB_CXX=g++-4.8 cmake ../src -DCMAKE_BUILD_TYPE=Release -DJS_CLIENT_PATH=/frontend  -DCMAKE_TOOLCHAIN_FILE=../src/Resources/CMake/LinuxStandardBaseToolchain.cmake
RUN make -j 5