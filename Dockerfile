FROM jodogne/orthanc

RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev; rm -rf /var/lib/apt/lists/*

ADD ./docker-install-web-dependencies.sh /root/docker-install-web-dependencies.sh
ADD ./docker-build-webviewer-js.sh /root/docker-build-webviewer-js.sh
ADD ./docker-build-webviewer.sh /root/docker-build-webviewer.sh
ADD . /root/osimis-webviewer

RUN bash /root/docker-install-web-dependencies.sh "default"
RUN bash /root/docker-build-webviewer-js.sh "default"
RUN bash /root/docker-build-webviewer.sh "default"

EXPOSE 4242
EXPOSE 8042

ENTRYPOINT [ "Orthanc" ]
CMD [ "/etc/orthanc/orthanc.json" ]
