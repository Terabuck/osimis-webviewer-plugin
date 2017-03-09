#!/bin/bash
# 
# @pre Execute `demo/scripts/buildDocker.sh`
# @pre Execute `reverse-proxy/scripts/buildDocker.sh`

set -x
set -e

srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"

# Launch demo w/ reverse proxy
docker-compose -f ${srcRoot}/docker-compose.yml -p wv_viewer up