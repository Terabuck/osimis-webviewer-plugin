# Cleanup on error & exit with last error status.
# File has to be sourced.
# This intend to replace "set -e"
#
# Usage:
# 	$ source errorHandler.sh

# activate debug mode
# set -x

branchName=${1:-$(git rev-parse --abbrev-ref HEAD)} #if no argument defined, get the branch name from git

# create error handler
function errorHandler {
	local lastError=$?

	echo "Handling error ${lastError}..." 1>&2

	# start from root folder
	cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/
	
	# cleanup (& provide branch name argument)
	./scripts/ciCleanup.sh $branchName &> /dev/null

	# exit with error status
    exit $lastError
}

# call errorHandler on error
trap errorHandler INT TERM ERR

