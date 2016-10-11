#!/usr/bin/env bash

# Build and populate the demo docker image.
# 
# @pre-condition:
# 	- Osimis Web Viewer plugin docker image has already been built (ie. the Dockerfile present at project root).
# 	- AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are in the environment
# 	
# @param {string} tag The docker tag used to identify the Osimis Web Viewer both original and demo docker image (cf. osimis/orthanc-webviewer-plugin:${tag}).
# 	default: the current GIT branch.
# 	
# @param {boolean} syncData Sync the S3 data container. (true | false)
# 	default: true

set -x
set -e

srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"

tag=${1:-$(git rev-parse --abbrev-ref HEAD)}
syncData=${2:-true};

# Force lower case because Docker sometimes make the conversion,
# sometimes it does not...
random=$(LC_CTYPE=POSIX \
	tr -c -d '[:alnum:]' < /dev/urandom \
	| head -c 10 \
	| dd conv=lcase 2> /dev/null \
)
network=wv_demo_${random}

orthancImage=osimis/orthanc-webviewer-plugin
orthancInternalDataPath=/orthancStorage
dataVolumeName=orthancSamplesDb2
dataVolumeDriver=local # @todo use azure volume https://github.com/Azure/azurefile-dockervolumedriver
tmpOrthancContainer=wv-demo-tmpcontainer-${random}

populatorImage=osimis/lify-orthanc:latest # keep lify name for cache (only diff is that lify uses a random tag as well)
populatorPath=${srcRoot}/demo/orthancPopulator/

demoImage=${DEMO_IMAGE:-osimis/orthanc-webviewer-plugin/demo}

# source: lify/scripts/createOrthancImageWithSample.sh

# clean previous demo with the same name
docker rm -f ${tmpOrthancContainer} || true

# creates the network used to bind the populator with the orthanc demo
docker network create ${network} || true

if [ "$syncData" = true ]; then
	# create the data volume
	docker volume create -d ${dataVolumeDriver} --name ${dataVolumeName}

	# build the populator image
	export AWS_ACCESS_KEY_ID
	export AWS_SECRET_ACCESS_KEY 
	docker build -t ${populatorImage} --build-arg AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} --build-arg AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} ${populatorPath}
fi

# create orthanc temporary container
docker create --network ${network} --name ${tmpOrthancContainer} -v ${dataVolumeName}:${orthancInternalDataPath} ${orthancImage}:${tag}

# copy config file in tmp orthanc (@warning config will only be applied once the container is restarted)
docker cp ${srcRoot}/demo/orthanc.config.json ${tmpOrthancContainer}:/etc/orthanc/orthanc.json

if [ "$syncData" = true ]; then
	# run orthanc
	docker start ${tmpOrthancContainer}

	# run the populator with the tmp orthanc
	docker run --rm --net=${network} ${populatorImage} -u http://${tmpOrthancContainer}:8042/

	# stop tmp orthanc
	docker stop $(docker ps -a -q --filter name=${tmpOrthancContainer} --format="{{.ID}}")
fi

# commit a new image from the tmp orthanc
docker commit $(docker ps -aqf "name=${tmpOrthancContainer}") ${demoImage}:${tag}

# remove tmp orthanc
docker rm $(docker ps -a -q --filter name=${tmpOrthancContainer} --format="{{.ID}}")

# delete the network
docker network rm ${network}