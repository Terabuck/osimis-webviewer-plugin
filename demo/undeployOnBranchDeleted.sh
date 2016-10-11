# !/usr/bin/env bash
# 
# Automatically called by deploy.sh
# 
# @param {string} tag The docker tag used to identify the Osimis Web Viewer docker image (cf. osimis/orthanc-webviewer-plugin:${tag}).
# 	default: Current GIT branch.
# 	
# @param {string} branchName Branch name. Used to kill demo once the specified branch does not exist on GIT repository anymore.
# 	default: Current GIT branch.

# srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
# tag=${1:-$(git rev-parse --abbrev-ref HEAD)}
# branchName=${2:-$(git rev-parse --abbrev-ref HEAD)}
# demoImage=${DEMO_IMAGE:-osimis/orthanc-webviewer-plugin/demo}

# function undeploy {
# 	docker rm $(docker stop $(docker ps -a -q --filter ancestor=${demoImage}:${tag} --format="{{.ID}}")) || true
# }

# Each hour,

# Check if git any branch has been removed
git ls-remote --heads origin

# -> retrieve corresponding docker container demo

# -> stop corresponding docker container demo

# -> remove corresponding docker container demo


# watch -n $((60*60)) --chgexit "\
# 	
# 	| grep refs/heads/${branchName}\
# 	| xargs --no-run-if-empty -I input_str\
# 	docker rm \$(docker stop \$(docker ps -a -q --filter ancestor=${demoImage}:${tag} --format="'"'"{{.ID}}"'"'"))\
# 	"
