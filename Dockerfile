FROM jodogne/orthanc

RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev; rm -rf /var/lib/apt/lists/*

ADD ./docker-build-webviewer.sh /root/docker-build-webviewer.sh
ADD . /root/osimis-webviewer

RUN bash /root/docker-build-webviewer.sh "default"

EXPOSE 4242
EXPOSE 8042

ENTRYPOINT [ "Orthanc" ]
CMD [ "/etc/orthanc/orthanc.json" ]
