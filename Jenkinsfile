node('docker') {
	stage 'Retrieve sources'
	checkout scm

	stage 'Build Frontend'
	sh 'scripts/ciBuildFrontend.sh ${BRANCH_NAME}'

	stage 'Build Docker Image'
	sh 'scripts/ciBuildDockerImage.sh ${BRANCH_NAME}'

	stage 'Run tests (TODO)'

	docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {

		stage 'push Docker Image to DockerHub'
		sh 'scripts/ciPushDockerImage.sh ${BRANCH_NAME}'
	}
}

