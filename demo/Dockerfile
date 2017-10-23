# let's start from an image with the sample data already in and we'll copy the viewer lib in it
# TODO: switch to Orthanc 1.3.1 when available
FROM osimis/orthanc-pro:mainline-20171022-demo-populated

COPY ./osimis-webviewer.json /etc/orthanc/osimis-webviewer.json

COPY binaries/libOsimisWebViewer.so /usr/share/orthanc/plugins/libOsimisWebViewer.so