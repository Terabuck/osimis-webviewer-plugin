#!/bin/bash
# this script pushed the osimis/orthanc-webviewer-plugin docker image to DockerHub.
# You must be logged in DockerHub before it runs.
#
# arguments: $1 = branchName (optional; if not provided, it will get it 
#                             from a git command.  In a jenkins build context,
#                             the branch name is not available through git so it must be
#                             passed as an argument)
set -e
set -x

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

source scripts/setBuildVariables.sh

imageName='osimis/orthanc-webviewer-plugin'

# push to docker hub (with the commit Id)
docker push $imageName:$releaseCommitId

# push to docker hub (with the branch name)
docker tag $imageName:$releaseCommitId $imageName:$releaseTag
docker push $imageName:$releaseTag

#if in master branch, the current tag should also be marked as the latest
if [[ $branchName == "master" ]]; then
	docker tag $imageName:$releaseCommitId $imageName:latest
	docker push $imageName:latest
fi