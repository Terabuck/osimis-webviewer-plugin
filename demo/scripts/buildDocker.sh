#!/bin/bash
#
# Build the webviewer demo as the docker image `osimis/orthanc-webviewer-plugin/demo:latest-local`.
# Populate it with DICOM samples retrieved from AWS and use `orthanc.config.json` as the orthanc
# configuration file.
# 
# @param {string} $1 Tag of the docker image being built.
#                    Default: `osimis/orthanc-webviewer-plugin:latest-local`
#                    - In CI, we should always use `latest-local` tag to be able to chain Dockerfile
#                      easily, using the FROM instruction.
#                    - @warning In the CI, this implies to lock the job to a single build at a time,
#                      otherwise we may push a wrong image.
# 
# @param {boolean} $2 Sync demo DICOM data with AWS (takes some time. most of the time, cache is enough).
#                     Default: `true`
# 
# @env {string} AWS_ACCESS_KEY_ID AWS credential.
#                                 Only required when $2 === true (to sync aws data).
# 
# @env {string} AWS_SECRET_ACCESS_KEY AWS credential.
#                                     Only required when $2 === true (to sync aws data).
# 
# @todo Remove orthanc populator (just add a sync script within the demo Dockerfile instead
#       and keep a shared volumes to avoid having to rebuild Orthanc DB everytime - like
#       our customers currently do).

set -x
set -e

# Define Dockerfile path
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
demoRoot="${srcRoot}/demo/" # Make sure we're in the demo folder

# $1 Name of the docker image
dockerImageName="osimis/orthanc-webviewer-plugin/demo:latest-local"

# $2 Sync demo data (default: true)
syncData=${2:-true};

# Configure the data volume
dataVolumeName=orthancSamplesDb2
dataVolumeDriver=local # @todo use azure volume https://github.com/Azure/azurefile-dockervolumedriver

# Build demo docker image
docker rmi -f osimis/orthanc-webviewer-plugin/tmp-populated-image:latest || true # @todo Use trap to clean image instead
docker build -t osimis/orthanc-webviewer-plugin/tmp-populated-image:latest ${demoRoot}

# Update the populator data's volume
if [ "$syncData" = true ]; then
    populatorImage=osimis/lify-orthanc:latest # keep lify name for cache (only diff is that lify uses a random tag as well)
    populatorPath=${srcRoot}/demo/orthancPopulator/

    # Create the data volume
    docker volume create -d ${dataVolumeDriver} --name ${dataVolumeName}

    # build the populator image
    export AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY 
    docker build -t ${populatorImage} --build-arg AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} --build-arg AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} ${populatorPath}
fi

# Creates the network used to bind the populator with the orthanc demo
network=wvdemopopulator
docker network rm ${network} || true
docker network create ${network}

# Create temporary webviewer container (to push dicom data into and then commit as an image)
tmpOrthancContainer=wv-demo-tmpcontainer
docker rm -f $tmpOrthancContainer || true # @todo Use trap to clean container instead
docker create --network ${network} --name ${tmpOrthancContainer} -v ${dataVolumeName}:/orthancStorage osimis/orthanc-webviewer-plugin/tmp-populated-image:latest

# Copy the populated data inside the demo image
if [ "$syncData" = true ]; then
    # Run webviewer container
    docker start ${tmpOrthancContainer}

    # Run the populator with the tmp orthanc
    docker run --rm --net=${network} ${populatorImage} -u http://${tmpOrthancContainer}:8042/

    # Stop tmp webviewer container
    docker stop $(docker ps -a -q --filter name=${tmpOrthancContainer} --format="{{.ID}}")
fi

# commit a new image with the populated data
docker commit $(docker ps -aqf "name=${tmpOrthancContainer}") ${dockerImageName}

# remove tmp orthanc
docker rm ${tmpOrthancContainer}
docker rmi osimis/orthanc-webviewer-plugin/tmp-populated-image:latest

# delete the network
docker network rm ${network}