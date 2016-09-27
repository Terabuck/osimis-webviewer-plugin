#!/usr/bin/groovy

// Set build parameters
def isUserDevBranch = env.BRANCH_NAME != "dev" && env.BRANCH_NAME != "master"

def userInput = [
    buildDocker: true,
    buildWindows: isUserDevBranch ? false : true,
    buildOSX: isUserDevBranch ? false : true
];

if (!isUserDevBranch) {
    echo 'Master/Dev branch: serious test & build business enforced...'
}
else {
    echo 'User personal branch: let the user choose what he wants to build...'

    // Let user override default settings (max 30 seconds to do so)
    try {
        timeout(time: 30, unit: 'SECONDS') {
            userInput = input(
                id: 'userInput', message: 'Configure build', parameters: [
                    [$class: 'BooleanParameterDefinition', defaultValue: userInput['buildDocker'], description: 'Build Docker (/!\\ false -> disable tests)', name: 'buildDocker'],
                    [$class: 'BooleanParameterDefinition', defaultValue: userInput['buildWindows'], description: 'Build Windows', name: 'buildWindows'],
                    [$class: 'BooleanParameterDefinition', defaultValue: userInput['buildOSX'], description: 'Build OSX', name: 'buildOSX']
                ]
            )
        }
    } catch (err) {
        // Do nothing, keep default settings (since user has not answered)
        echo "User personal branch: user either has aborted or hasn't chosen the build settings within the 30 seconds delay..."
    }
}

// Print the build parameters
echo 'Build Docker  : ' + (userInput['buildDocker'] ? 'OK' : 'KO (/!\\ tests disabled)')
echo 'Build Windows : ' + (userInput['buildWindows'] ? 'OK' : 'KO')
echo 'Build OSX     : ' + (userInput['buildOSX'] ? 'OK' : 'KO')

// Init environment
stage 'Retrieve: sources'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        checkout scm
        sh 'scripts/ciLogDockerState.sh prebuild'
        sh 'scripts/setEnv.sh ${BRANCH_NAME}'
    }
}

// Build frontend
stage 'Build: js'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        sh 'scripts/ciBuildFrontend.sh'
    }
}

// Publish temporary frontend so we can embed it within orthanc plugin
stage 'Publish: js -> AWS (commitId)'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
            sh 'scripts/ciPushFrontend.sh tagWithCommitId'
        }
    }
}

// Build windows
// @todo parallelize windows & linux builds once this feature is available 
if (userInput['buildWindows']) {
    stage name: 'Build: windows', concurrency: 1
    node('windows && vs2015') {
        //stage 'Retrieve sources'
        checkout scm

        //stage 'Build C++ Windows plugin'
        bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% build'
    }
}

// Build docker & launch tests
if (userInput['buildDocker']) {
    stage name: 'Build: docker', concurrency: 1 // Low concurrency to reduce test timeout
    node('docker') {
        wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
            sh 'scripts/ciBuildDockerImage.sh'
        }
    }

    stage name: 'Test: unit + integration', concurrency: 1 // Low concurrency to reduce test timeout
    node('docker') {
        wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
            // @note Requires the built docker image to work
            sh 'scripts/ciPrepareTests.sh'
            sh 'scripts/ciRunCppTests.sh'
            sh 'scripts/ciRunJsTests.sh'
        }
    }
}

// Publish windows release
if (userInput['buildWindows']) {
    node('windows && vs2015') {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
            stage 'Publish: C++ Windows plugin'
            bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% publish'
        }
    }
}

// Publish docker release
stage 'Publish: orthanc -> DockerHub'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        if (userInput['buildDocker']) {
            docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {
                sh 'scripts/ciPushDockerImage.sh'
            }
        }
    }
}

// Publish js code
stage 'Publish: js -> AWS (release)'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
            sh 'scripts/ciPushFrontend.sh tagWithReleaseTag'
        }
    }
}

// Clean up
stage 'Clean up'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        sh 'scripts/ciLogDockerState.sh postbuild'
        sh 'scripts/ciCleanup.sh'
    }
}
