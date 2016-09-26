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

// Always build frontend w/ docker (because it's fast enough)
stage 'Retrieve: sources'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        checkout scm
        sh 'scripts/ciLogDockerState.sh prebuild'
        sh 'scripts/setEnv.sh ${BRANCH_NAME}'
    }
}

stage 'Build: js'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        sh 'scripts/ciBuildFrontend.sh'
    }
}

stage 'Publish: js -> AWS (commitId)'
node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
            sh 'scripts/ciPushFrontend.sh tagWithCommitId'
        }
    }
}

// Build on selected platforms in parallel
stage name: 'Build + Test', concurrency: 1
parallel(
    windows: {
        if (userInput['buildWindows']) {
            node('windows && vs2015') {
                //stage 'Retrieve sources'
                checkout scm

                //stage 'Build C++ Windows plugin'
                bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% build'
            }
        }
    },
    docker: {
        if (userInput['buildDocker']) {
            node('docker') {
                wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
                    // stage 'Build: cpp', concurrency: 2
                    sh 'scripts/ciBuildDockerImage.sh'

                    // stage 'Test: setup'
                    sh 'scripts/ciPrepareTests.sh'

                    // stage 'Test: cpp'
                    sh 'scripts/ciRunCppTests.sh'

                    // stage 'Test: integration + js'
                    sh 'scripts/ciRunJsTests.sh'
                }
            }
        }
    }
)

// Publish release
if (userInput['buildWindows']) {
    node('windows && vs2015') {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
            stage 'Publish C++ Windows plugin'
            bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% publish'
        }
    }
}

node('docker') {
    wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {

        stage 'Publish: js -> AWS (release)'
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
            sh 'scripts/ciPushFrontend.sh tagWithReleaseTag'
        }

        if (userInput['buildDocker']) {
            stage 'Publish: orthanc -> DockerHub'
            docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {
                sh 'scripts/ciPushDockerImage.sh'
            }
        }

        stage 'Clean up'
        sh 'scripts/ciLogDockerState.sh postbuild'
        sh 'scripts/ciCleanup.sh'
    }
}
