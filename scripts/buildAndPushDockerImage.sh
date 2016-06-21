#!/bin/bash
# this script builds the osimis/orthanc-webviewer-plugin docker image and
# pushes it to DockerHub.  You must be logged in DockerHub before it runs.
set -e
set -x

#start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

imageName='osimis/orthanc-webviewer-plugin'
branchName=$(git rev-parse --abbrev-ref HEAD)
if [ $branchName == 'master' ]; then
	imageTag='latest'
else
	imageTag=$branchName
fi

#if the branch name is something like 'am/WVB-27', the image tag should be 'am-WVB-27'
#replace / by -
imageTag=${imageTag/\//-}

docker build -t $imageName:$imageTag .

docker push $imageName:$imageTag

