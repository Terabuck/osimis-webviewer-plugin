# This docker file builds the backend, not the frontend (the frontend build is downloaded to be embedded if not available).
# The CI generates the frontend build, uploads it to aws and then builds this dockerfile.

FROM jodogne/orthanc-plugins:1.1.0

RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev git; rm -rf /var/lib/apt/lists/*

ADD . /root/osimis-webviewer

RUN bash /root/osimis-webviewer/scripts/buildCppLibraryFromDocker.sh "default"
