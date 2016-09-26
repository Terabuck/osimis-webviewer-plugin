#!/usr/bin/groovy
node('docker') {
	wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {

		stage 'Retrieve: sources'
		checkout scm
		sh 'scripts/ciLogDockerState.sh prebuild'
		sh 'scripts/setEnv.sh ${BRANCH_NAME}'

		stage 'Build: js'
		sh 'scripts/ciBuildFrontend.sh'

		stage 'Publish: js -> AWS (commitId)'
		withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
			sh 'scripts/ciPushFrontend.sh tagWithCommitId'
		}
	}
}

stage 'build & test on windows & docker'
parallel windows: {
		node('windows && vs2015') {
		    //stage 'Retrieve sources'
		    checkout scm

		    //stage 'Build C++ Windows plugin'
		    bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% build'
		}

	},
	docker: {
		node('docker') {
			wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
				//stage 'Build: cpp'
				sh 'scripts/ciBuildDockerImage.sh'

				//stage 'Test: setup'
				sh 'scripts/ciPrepareTests.sh'

				//stage 'Test: cpp'
				sh 'scripts/ciRunCppTests.sh'

				//stage 'Test: integration + js'
				sh 'scripts/ciRunJsTests.sh'
			}
		}
	}

node('windows && vs2015') {

	withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
	    stage 'Publish C++ Windows plugin'
	    bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% publish'
	}
}

node('docker') {
	wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {

		stage 'Publish: js -> AWS (release)'
		withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
			sh 'scripts/ciPushFrontend.sh tagWithReleaseTag'
		}

		stage 'Publish: orthanc -> DockerHub'
		docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {
			sh 'scripts/ciPushDockerImage.sh'
		}

		stage 'Clean up'
		sh 'scripts/ciLogDockerState.sh postbuild'
		sh 'scripts/ciCleanup.sh'
	}
}

