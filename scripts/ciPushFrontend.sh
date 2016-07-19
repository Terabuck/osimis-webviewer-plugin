#!/bin/bash
set -e
set -x

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/

source scripts/setBuildVariables.sh

tagType=${2:-tagWithCommitId}  # before the code is validate, we don't wan't to push code with a branch name that could overwrite a valid one that is already on AWS server.  So, only push the commit id
if [[ $tagType == "tagWithReleaseTag" ]]; then
    zipFileToUpload=$releaseTag
else
    zipFileToUpload=$releaseCommitId
fi

# upload to AWS.  
# -------------
cd frontend/

# we first need to create the container before we can copy files to it
export AWS_ACCESS_KEY_ID      # export these 2 environment variables that are defined in Jenkins master config
export AWS_SECRET_ACCESS_KEY 
export zipFileToUpload
awsContainerId=$(docker create -v /toolbox/ -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY anigeo/awscli s3 --region eu-west-1 cp /toolbox/$zipFileToUpload.zip s3://orthanc.osimis.io/public/osimisWebViewer/)

# copy the zip from the host to the AWS container
docker cp $releaseCommitId.zip $awsContainerId:/toolbox/$zipFileToUpload.zip

# upload
docker start -a $awsContainerId

# remove container
docker rm $awsContainerId

echo '------------------------'
echo 'File uploaded.'
echo 'File is downloadable at:'
echo 'http://orthanc.osimis.io/public/osimisWebViewer/'$zipFileToUpload'.zip'
echo '------------------------'