#!/usr/bin/env bash
#
# @warning Automatically kill the demo when the corresponding GIT branch does not exist anymore in repository.
#
# @pre-condition:
#   * demo/build.sh has been called.
#
# @param {string} -t The docker tag used to identify the Osimis Web Viewer docker image (cf. osimis/orthanc-webviewer-plugin:${tag}).
# 	default: Current GIT branch.
# 	
# @param {string} -b Branch name. Used to kill demo once the specified branch does not exist on GIT repository anymore.
# 	default: Current GIT branch.
#
# @param {int} -p The port used for deployment. Port 20000-40000 are availables.
#   default: $DEMO_PORT or 3333.
#   
# @param {string} -u UrlTemplate. For instance: http://my.dns.com:%s/.

# Default values
srcRoot="${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
tag=$(git rev-parse --abbrev-ref HEAD)
branchName=$(git rev-parse --abbrev-ref HEAD)
port=${DEMO_PORT:-3333}
demoImage=${DEMO_IMAGE:-osimis/orthanc-webviewer-plugin/demo}

orthancInternalDataPath=/orthancStorage
dataVolumeName=orthancSamplesDb2

# Usage
function usage {
	cat <<-EOF 1>&2
	Usage: $(basename "$0") [OPTIONS...]
	 -h             this help list
	 -u             uri template - eg. http://my.dns.com:%s/
	 -p             exposed demo port
	 -t             chosen tag for demo
	 -b 			branch name - used to kill demo once the specified branch does not exist on GIT repository anymore
	EOF
}

# GetOpts
declare uriTemplate
while getopts "hu:p:t:b:" opt; do
	case $opt in
	h) usage; exit;;
	u) uriTemplate=$OPTARG;;
	p) port=$OPTARG;;
	t) tag=$OPTARG;;
	b) branchName=$OPTARG;;
	'?') usage; exit 1;;
	esac
done

set -x

# Stop previous demo using the same tag (if exists)
demoContainer="$(echo "wv_demo_${tag}" | LC_CTYPE=POSIX \
	tr -c -d '[:alnum:]' \
	| dd conv=lcase 2> /dev/null
)"
docker rm $(docker stop $(docker ps -a -q --filter name=${demoContainer} --format="{{.ID}}")) || true

# Launch demo
docker run -p ${port}:8042 -v ${dataVolumeName}:${orthancInternalDataPath} --name ${demoContainer} -d ${demoImage}:${tag}

# Print URL
if [[ $uriTemplate ]]; then
	set +o xtrace
	uri=$(printf "$uriTemplate" $port)
	echo -e "\e[1;32m"
	cat <<-EOF
	Deployment URI:
	  ${uri}
	  ${uri}osimis-viewer/app/index.html
	EOF
	echo -e "\e[0m"
	fortune 2>/dev/null || true
fi
