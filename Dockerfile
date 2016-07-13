FROM jodogne/orthanc-plugins:1.1.0

# Install CPP build dependencies
RUN DEBIAN_FRONTEND=noninteractive apt-get update; apt-get -y install libgdcm2-dev libjpeg-dev git; rm -rf /var/lib/apt/lists/*

# Install JS build dependencies
# turn on universe packages
RUN echo "deb http://archive.ubuntu.com/ubuntu raring main universe" > /etc/apt/sources.list

# basics for rvm
RUN apt-get update; apt-get -y install nginx openssh-server git-core openssh-client curl; rm -rf /var/lib/apt/lists/*
RUN apt-get update; apt-get -y install nano; rm -rf /var/lib/apt/lists/*
RUN apt-get update; apt-get -y install build-essential; rm -rf /var/lib/apt/lists/*
RUN apt-get update; apt-get -y install openssl libreadline6 libreadline6-dev curl zlib1g zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev automake libtool bison subversion pkg-config; rm -rf /var/lib/apt/lists/*

# install RVM, Ruby, and Bundler
RUN gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
RUN \curl -L https://get.rvm.io | bash -s stable
RUN /bin/bash -l -c "rvm requirements"
RUN /bin/bash -l -c "rvm install 2.3"
RUN /bin/bash -l -c "gem install bundler --no-ri --no-rdoc"

#RUN gem install sass && gem install compass
RUN gem install compass
RUN curl -sL https://deb.nodesource.com/setup_5.x | bash - && \
   apt-get install -y --force-yes nodejs
RUN npm install -g bower && npm install --global gulp-cli

ADD . /root/osimis-webviewer

RUN bash /root/osimis-webviewer/scripts/dockerBuildJs.sh "default"
RUN bash /root/osimis-webviewer/scripts/dockerBuildWebViewer.sh "default"

EXPOSE 4242
EXPOSE 8042

ENTRYPOINT [ "Orthanc" ]
CMD [ "/etc/orthanc/orthanc.json" ]
