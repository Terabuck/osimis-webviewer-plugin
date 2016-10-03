#!/usr/bin/groovy

// Set build parameters
def isUserDevBranch = env.BRANCH_NAME != "dev" && env.BRANCH_NAME != "master" && !env.BRANCH_NAME.startsWith("release")

def userInput = [
    buildDocker: true,
    buildWindows: isUserDevBranch ? false : true,
    buildOSX: isUserDevBranch ? false : true
];

if (/*!isUserDevBranch*/ false) { // @warning @todo uncomment to force windows build on dev
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

// Lock overall build to avoid issues related to slow unit test runs or docker ip/name conflicts for instance
// This allow to benefits the optimization of using a common workspace for every branches (for instance, test
// preparation docker image is reused in new branches), but can increase slowness if the branch content differences
// is heavy (in terms of disk space). Use jenkins' dir plugin instead of ws plugin to have control over our own locking mechanism.
// @warning make sure not to use the jenkins' dir plugin if this lock is removed.
lock(resource: 'webviewer', inversePrecedence: false) {
    def workspacePath = '../_common-ws'

    // Init environment
    stage('Retrieve: sources') {
        node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
            checkout scm
            sh 'scripts/ciLogDockerState.sh prebuild'
            sh 'scripts/setEnv.sh ${BRANCH_NAME}'
        }}}
    }

    // Build frontend
    stage('Build: js') {
        node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
            sh 'scripts/ciBuildFrontend.sh'
        }}}
    }

    // Publish temporary frontend so we can embed it within orthanc plugin
    stage('Publish: js -> AWS (commitId)') {
        node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
            withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
                sh 'scripts/ciPushFrontend.sh tagWithCommitId'
            }
        }}}
    }
    
    def buildMap = [:]

    // Build windows
    if (userInput['buildWindows']) {
        buildMap.put('windows', {
            stage('Build: windows') {
                node('windows && vs2015') {
                    //stage('Retrieve sources') {}
                    checkout scm

                    //stage('Build C++ Windows plugin') {}
                    bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% build'
                }
            }
        })
    }

    // Build osx
    if (userInput['buildOSX']) {
        buildMap.put('osx', {
            stage('Build: osx') {
                node('osx') { dir(path: workspacePath) {
                    //stage('Retrieve sources') {}
                    checkout scm

                    //stage('Build C++ OSX plugin') {}
                    sh 'cd scripts && ./ciBuildOSX.sh $BRANCH_NAME build'
                }}
            }
        })
    }

    // Build docker & launch tests
    if (userInput['buildDocker']) {
        buildMap.put('docker', {
            stage('Build: docker') {
                node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
                    sh 'scripts/ciBuildDockerImage.sh'
                }}}
            }

            stage('Test: unit + integration') {
                node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
                    // @note Requires the built docker image to work
                    sh 'scripts/ciPrepareTests.sh'
                    sh 'scripts/ciRunCppTests.sh'
                    sh 'scripts/ciRunJsTests.sh'
                }}}
            }
        })
    }

    parallel(buildMap)

    // Wait for docker build (& integration tests) before running publishing scripts

    def publishMap = [:]

    // Publish osx release
    if (userInput['buildOSX']) {
        publishMap.put('osx', {
            stage('Publish: osx') {
                node('osx') { dir(path: workspacePath) {
                    //stage('Retrieve sources') {}
                    checkout scm

                    //stage('Publish C++ OSX plugin') {}
                    sh 'cd scripts && ./ciBuildOSX.sh $BRANCH_NAME publish'
                }}
            }
        })
    }

    // Publish windows release
    if (userInput['buildWindows']) {
        publishMap.put('windows', {
            stage('Publish: C++ Windows plugin') {
                node('windows && vs2015') {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
                        bat 'cd scripts & powershell.exe ./ciBuildWindows.ps1 %BRANCH_NAME% publish'
                    }
                }
            }
        })
    }

    // Publish docker release
    if (userInput['buildDocker']) {
        publishMap.put('docker', {
            stage('Publish: orthanc -> DockerHub') {
                node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-jenkinsosimis') {
                        sh 'scripts/ciPushDockerImage.sh'
                    }
                }}}
            }
        })
    }

    parallel(publishMap)

    // Publish js code
    stage('Publish: js -> AWS (release)') {
        node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
            withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-orthanc.osimis.io']]) {
                sh 'scripts/ciPushFrontend.sh tagWithReleaseTag'
            }
        }}}
    }

    // Clean up
    stage('Clean up') {
        node('master && docker') { dir(path: workspacePath) { wrap([$class: 'AnsiColorBuildWrapper']) {
            sh 'scripts/ciLogDockerState.sh postbuild'
            sh 'scripts/ciCleanup.sh'
        }}}
    }

}
