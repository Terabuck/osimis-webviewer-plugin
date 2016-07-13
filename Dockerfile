FROM jodogne/orthanc-plugins:1.1.0
# FROM ruby:2.3

# #RUN gem install sass && gem install compass
# RUN gem install compass
# RUN curl -sL https://deb.nodesource.com/setup_5.x | bash - && \
#    apt-get install -y --force-yes nodejs
# RUN npm install -g bower && npm install --global gulp-cli



RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev git; rm -rf /var/lib/apt/lists/*

ADD . /root/osimis-webviewer

RUN bash /root/osimis-webviewer/scripts/dockerBuildWebViewer.sh "default"

EXPOSE 4242
EXPOSE 8042

ENTRYPOINT [ "Orthanc" ]
CMD [ "/etc/orthanc/orthanc.json" ]
