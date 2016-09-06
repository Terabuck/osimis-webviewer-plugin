node('windows') {
    stage 'Retrieve sources'
    checkout scm

    stage 'Build C++ Windows plugin'
    bat 'cd scripts & ciBuildWindows.bat %BRANCH_NAME%'
}

node('docker') {
    stage 'Retrieve sources'
    checkout scm

	stage 'Build Frontend'
	sh 'scripts/ciBuildFrontend.sh ${BRANCH_NAME}'

	withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
		stage 'Push Frontend lib to AWS (commitId tag)'
		sh 'scripts/ciPushFrontend.sh ${BRANCH_NAME} tagWithCommitId'
	}

	stage 'Build Docker Image'
	sh 'scripts/ciBuildDockerImage.sh ${BRANCH_NAME}'

	stage 'Run tests (TODO)'
}

node('windows') {
    stage 'Retrieve sources'
    checkout scm
}

node('docker') {
	withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
		stage 'Push Frontend lib to AWS (releaseTag)'
		sh 'scripts/ciPushFrontend.sh ${BRANCH_NAME} tagWithReleaseTag'
	}

	docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {
		stage 'push Docker Image to DockerHub'
		sh 'scripts/ciPushDockerImage.sh ${BRANCH_NAME}'
	}

	stage 'Cleanup'
	sh 'scripts/ciCleanup.sh ${BRANCH_NAME}'
}

