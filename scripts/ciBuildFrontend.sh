#!/bin/bash
set -e
set -x

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/


gitLongTag=$(git describe --long --dirty)
branchName=${1:-$(git rev-parse --abbrev-ref HEAD)} #if no argument defined, get the branch name from git

if [[ $branchName == "master" ]]; then
	
	# in the master branch, make sure the tag is clean ('1.2.3'; not 1.2.3-alpha) and there has been 0 commits since the tag has been set.
	if [[ $gitLongTag =~ [0-9]+.[0-9]+.[0-9]+-0-[0-9a-g]{8}$ ]]; then 

		versionNumber=$(echo $gitLongTag | sed -r "s/([0-9]+\.[0-9]+\.[0-9]+)-[0-9]+-.+/\1/")
	else

		echo "Invalid tag on the master branch.  Make sure you have just tagged the master branch with something like '1.2.3' and that there has been no commit after the tag."
		exit -1	
	fi

else
	# in other branches than master, the versionNumber is the branchName
	versionNumber=$branchName
	
	# if the branch name is something like 'am/WVB-27', the image tag should be 'am-WVB-27'
	# replace / by -
	versionNumber=${versionNumber//\//-}
fi


# build the lib
# -------------
cd frontend/

docker build --tag=osimis/frontend-builder --file=DockerfileFrontEndBuilder .

# we first need to create the container before we can copy files to it
export versionNumber
webAppBuilderContainerId=$(docker create --entrypoint=/bin/bash osimis/frontend-builder -c "cd /frontend && ls -al && gulp build && ls -al")

# copy the frontendToolbox files in the container
docker cp $(pwd)/ $webAppBuilderContainerId:/

# run
docker start -a $webAppBuilderContainerId

# copy the build output folder to the host
docker cp $webAppBuilderContainerId:/frontend/build/ $(pwd)/build/

# remove container
docker rm $webAppBuilderContainerId


# upload to AWS.  
# -------------

# # we first need to create the container before we can copy files to it
# awsContainerId=$(docker create -v /toolbox/ -e AWS_ACCESS_KEY_ID=AKIAJUSMEOVHHTIM3KUA -e AWS_SECRET_ACCESS_KEY=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 anigeo/awscli s3 --region eu-west-1 cp /toolbox/$versionNumber.zip s3://orthanc.osimis.io/private/frontEndToolbox/)

# # copy the zip from the host to the AWS container
# docker cp $versionNumber.zip $awsContainerId:/toolbox/$versionNumber.zip

# # upload
# docker start -a $awsContainerId

# # remove container
# docker rm $awsContainerId

# echo '------------------------'
# echo 'File uploaded.'
# echo 'File is downloadable at:'
# echo 'http://orthanc.osimis.io/private/frontEndToolbox/'$versionNumber'.zip'
# echo '------------------------'

