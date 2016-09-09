#!/usr/bin/groovy
node('docker') {
	wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {

		stage 'Retrieve: sources'
		checkout scm

		stage 'Build: js'
		sh 'scripts/ciLogDockerState.sh prebuild'
		sh 'scripts/ciBuildFrontend.sh ${BRANCH_NAME}'

		stage 'Publish: js -> AWS (commitId)'
		withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
			sh 'scripts/ciPushFrontend.sh ${BRANCH_NAME} tagWithCommitId'
		}

		stage 'Build: cpp'
		sh 'scripts/ciBuildDockerImage.sh ${BRANCH_NAME}'

		stage 'Test: setup'
		sh 'scripts/ciPrepareTests.sh ${BRANCH_NAME}'

		stage 'Test: cpp'
		sh 'scripts/ciRunCppTests.sh ${BRANCH_NAME}'

		stage 'Test: integration + js'
		sh 'scripts/ciRunJsTests.sh ${BRANCH_NAME}'

		stage 'Publish: js -> AWS (release)'
		withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
			sh 'scripts/ciPushFrontend.sh ${BRANCH_NAME} tagWithReleaseTag'
		}

		stage 'Publish: orthanc -> DockerHub'
		docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {
			sh 'scripts/ciPushDockerImage.sh ${BRANCH_NAME}'
		}

		stage 'Clean up'
		sh 'scripts/ciLogDockerState.sh postbuild'
		sh 'scripts/ciCleanup.sh ${BRANCH_NAME}'

	}
}

