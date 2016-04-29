FROM jodogne/orthanc-plugins

RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev git; rm -rf /var/lib/apt/lists/*

ADD . /root/osimis-webviewer
WORKDIR /root/osimis-webviewer
RUN ls -al
RUN git status
RUN git describe

RUN bash /root/osimis-webviewer/scripts/dockerBuildWebViewer.sh "default"

EXPOSE 4242
EXPOSE 8042

ENTRYPOINT [ "Orthanc" ]
CMD [ "/etc/orthanc/orthanc.json" ]
