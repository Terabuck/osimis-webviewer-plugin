# source: lify/orthancPopulator/DockerFile

FROM python:3.5

WORKDIR /populator/

# install python requirements : awscli and pythonToolbox
COPY requirements.txt .
RUN pip install -r requirements.txt

# download samples in aws
# @warning may randomly break on OSX, see http://stackoverflow.com/questions/22800624/will-docker-container-auto-sync-time-with-the-host-machine
#          type `docker-machine ssh default 'sudo ntpclient -s -h pool.ntp.org'`
ARG AWS_ACCESS_KEY_ID=?????
ARG AWS_SECRET_ACCESS_KEY=?????
RUN aws s3 sync "s3://osimisviewerdicomfiles/orthancSamplesDb2/1234 ONCO/simpleDb" /populator/orthancSamples

# creates the folder that will holds population scripts
COPY populator.py .

# run the populator python script
ENTRYPOINT ["python", "populator.py"]
CMD []

