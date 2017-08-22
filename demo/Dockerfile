# let's start from an image with the sample data already in and we'll copy the viewer lib in it
FROM osimis/orthanc-pro:latest-demo-populated

COPY ./osimis-webviewer.json /etc/orthanc/osimis-webviewer.json

COPY binaries/libOsimisWebViewer.so /usr/share/orthanc/plugins/libOsimisWebViewer.so