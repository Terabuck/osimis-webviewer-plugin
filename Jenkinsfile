node('docker') {
	stage 'Retrieve sources'
	checkout scm

	docker.withRegistry('https://registry-1.docker.io/', 'dockerhub-jenkinsosimis') {

		stage 'Build and push Osimis viewer image'
		sh 'scripts/buildAndPushDockerImage.sh'
	}
}

