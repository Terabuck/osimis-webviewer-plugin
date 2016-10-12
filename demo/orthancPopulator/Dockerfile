# source: lify/orthancPopulator/DockerFile

FROM python:3.5

WORKDIR /populator/

# install python requirements : awscli and pythonToolbox
COPY requirements.txt .
RUN pip install -r requirements.txt

# download samples in aws
ARG AWS_ACCESS_KEY_ID=?????
ARG AWS_SECRET_ACCESS_KEY=?????
RUN aws s3 sync s3://osimisviewerdicomfiles/orthancSamplesDb2 orthancSamples

# creates the folder that will holds population scripts
COPY populator.py .

# run the populator python script
ENTRYPOINT ["python", "populator.py"]
CMD []

