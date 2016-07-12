node('docker') {
	stage 'Retrieve sources'
	checkout scm

	docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {

		stage 'Build and push Osimis viewer image'
		sh 'scripts/buildAndPushDockerImage.sh ${BRANCH_NAME}'
	}
}

