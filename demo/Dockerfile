# let's start from an image with the sample data already in and we'll copy the viewer lib in it
# note that we need an Orthanc SDK 1.3.1 and this is only available in the mainline right now !
FROM osimis/orthanc-pro:17.11.2-orthanc-mainline-20171125-demo-populated

COPY ./osimis-webviewer.json /etc/orthanc/osimis-webviewer.json

COPY binaries/libOsimisWebViewer.so /usr/share/orthanc/plugins/libOsimisWebViewer.so