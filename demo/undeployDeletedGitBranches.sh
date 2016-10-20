# !/bin/bash
# @warning not working in dash
# 
# This removes all the demo images and containers related to git branches no longer existing in remote repository.
# It makes the assumption every demo images are tagged by branch name
# 
# Must be run within the osimis-webviewer-plugin repo to be able to retrieve remote git branch list
# 
# Called by a specific `webviewer-decommissioning` jenkins cron job

set -x
set -e

srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
demoImage=${DEMO_IMAGE:-osimis/orthanc-webviewer-plugin/demo}

# # Retrieve the ssh key from jenkins and use it with git
# # @warning will fail on windows
# # Because of https://issues.jenkins-ci.org/browse/JENKINS-28399 not released
# gitCmd='git'
# if [ -n "$GIT_SSH_KEY" ]; then
# 	echo $GIT_SSH_KEY > ssh.private
# 	chmod 700 ssh.private # fix "key_load_private_type: bad permissions"

# 	# GIT_SSH only work with commands, can't accept parameters
# 	echo '#!/bin/bash' > custom_ssh.sh
# 	echo "exec echo \"SHOULD_ADD_PASSPHRASE_HERE\" | ./demo/sshaskpass.sh ssh -t -t -o StrictHostKeyChecking=no -i \"$(pwd)/ssh.private\" git@bitbucket.org \"$@\"" >> custom_ssh.sh # see http://stackoverflow.com/questions/7114990/pseudo-terminal-will-not-be-allocated-because-stdin-is-not-a-terminal for -t -t 

# 	chmod +x custom_ssh.sh
# 	export GIT_SSH="$(pwd)/custom_ssh.sh"
# fi

# echo $(${gitCmd} ls-remote --heads origin)

# # Remove key
# if [ -n "$GIT_SSH_KEY" ]; then
# 	# rm ssh.private # @warning won't be removed if git ls-remote fail! for cleanup, error should be trapped instead
# 	# rm custom_ssh.sh
# 	# rm sshpass.sh
# 	# @todo use "file credential" instead
# fi

# Retrieve git branches existing in repository (ls-remote do query the remote, no need to fetch)
# branchesInGitRemote=$(${gitCmd} ls-remote --heads origin | awk '{ print $2 '\n' }' | cut -c 12-)
# Set none because jenkins can't manage to provide ssh credentials and we can't retrieve branches...
# This line will remove every single demo except dev and master ones.
branchesInGitRemote='dev master'

# Retrieve git branches corresponding to docker images
branchesInDocker=$(docker images | grep ${demoImage} | awk '{ print $2 '\n' }')

# Compare these to retrieve docker images not in git anymore
echo "${branchesInDocker}" | sort > /tmp/branchesInDocker.txt # sort needed by `comm`
echo "${branchesInGitRemote}" | sort > /tmp/branchesInGitRemote.txt
branchesToRemove=$(comm -23 /tmp/branchesInDocker.txt /tmp/branchesInGitRemote.txt)
rm /tmp/branchesInDocker.txt /tmp/branchesInGitRemote.txt

# Retrieve docker containers using these branches as tag
for branch in $branchesToRemove; do
	# Stop & remove them
	docker stop $(docker ps -a -q --filter ancestor=${demoImage}:${branch}) || true
	docker rm -v $(docker ps -a -q --filter ancestor=${demoImage}:${branch}) || true
done

# Remove related images
for branch in $branchesToRemove; do
	docker rmi ${demoImage}:${branch} || true
done