#!/bin/bash
# this script builds the osimis/orthanc-webviewer-plugin docker image and
# pushes it to DockerHub.  You must be logged in DockerHub before it runs.
#
# arguments: $1 = branchName (optional; if not provided, it will get it 
#                             from a git command.  In a jenkins build context,
#                             the branch name is not available through git so it must be
#                             passed as an argument)
set -e
set -x

#start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

imageName='osimis/orthanc-webviewer-plugin'

gitLongTag=$(git describe --long --dirty)
branchName=${1:-$(git rev-parse --abbrev-ref HEAD)} #if no argument defined, get the branch name from git

if [[ $branchName == "master" ]]; then
	
	#in the master branch, make sure the tag is clean ('1.2.3'; not 1.2.3-alpha) and there has been 0 commits since the tag has been set.
	if [[ $gitLongTag =~ [0-9]+.[0-9]+.[0-9]+-0-[0-9a-g]{8}$ ]]; then 

		versionNumber=$(echo $gitLongTag | sed -r "s/([0-9]+\.[0-9]+\.[0-9]+)-[0-9]+-.+/\1/")
		imageTag=$versionNumber # in the master branch, the image tag is the version number (latest tag like '1.0.0')
	else

		echo "Invalid tag on the master branch.  Make sure you have just tagged the master branch with something like '1.2.3' and that there has been no commit after the tag."
		exit -1	
	fi

else
	# in other branches than master, the imageTag is the branchName
	imageTag=$branchName
	
	#if the branch name is something like 'am/WVB-27', the image tag should be 'am-WVB-27'
	#replace / by -
	imageTag=${imageTag//\//-}
fi

#build and push to docker hub
docker push $imageName:$imageTag

#if in master branch, the current tag should also be marked as the latest
if [[ $branchName == "master" ]]; then
	docker tag $imageName:$imageTag $imageName:latest
	docker push $imageName:latest
fi
