from helpers import BuildHelpers, GitHelpers, FileHelpers, CmdHelpers
import logging
import platform
import os
import shutil
from subprocess import call
import argparse

logging.basicConfig(level = logging.INFO)

parser = argparse.ArgumentParser()
parser.add_argument("branchName")
parser.add_argument("viewerVersion") # git describe --tags --long --dirty=-dirty
parser.add_argument('action',
                    choices = ['build',
                               'publish'],
                    default = 'build')

args = parser.parse_args()

rootFolder = os.path.join(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..'), '..')

gitBranchInfo = GitHelpers.getVersion(os.path.dirname(__file__))
commitId = gitBranchInfo.commitSha1
taggedVersion = str(gitBranchInfo.major) + '.' + str(gitBranchInfo.minor) + '.' + str(gitBranchInfo.revision) + (('-' + gitBranchInfo.preReleaseName) if gitBranchInfo.preReleaseName is not None else '')

configs = [
    {
        'name': "64bits",
        'builder': BuildHelpers.BUILDER_VS2015_64BITS,
        'buildFolder': "build/build64",
        'webFolder': 'win64'
    },
    {
        'name': "32bits",
        'builder': BuildHelpers.BUILDER_VS2015_32BITS,
        'buildFolder': "build/build32",
        'webFolder': 'win32'
    },
    {
        'name': "osx",
        'builder': BuildHelpers.BUILDER_XCODE,
        'buildFolder': "build/osx",
        'webFolder': 'osx'
    }
]


def build(config):
    logging.info("Building {name} version".format(name = config['name']))

    buildFolder = os.path.join(rootFolder, config['buildFolder'])
    os.makedirs(buildFolder, exist_ok = True)
    os.chdir(buildFolder)

    ret = BuildHelpers.buildCMake(cmakeListsFolderPath = os.path.join(rootFolder, 'backend'),
                                  buildFolderPath = buildFolder,
                                  cmakeTargetName = 'OsimisWebViewer',
                                  cmakeTargetsOSX = ['OsimisWebViewer', 'UnitTests'],
                                  cmakeArguments = [
                                    '-DJS_CLIENT_CLEAN_FIRST:BOOL=ON', 
                                    '-DVIEWER_VERSION_FULL:STRING='+str(args.viewerVersion),
                                    '-DJS_CLIENT_PATH=frontend-build',
                                    '-DORTHANC_FRAMEWORK_VERSION=mainline',
                                    '-DORTHANC_FRAMEWORK_SOURCE=hg'
                                    ],
                                  builder = config['builder'],
                                  config = BuildHelpers.CONFIG_RELEASE
                                  )
    if ret != 0:
        exit(ret)

    logging.info("Running unit tests ({name})".format(name = config['name']))

    os.chdir(os.path.join(buildFolder, 'Release'))
    ret = call(BuildHelpers.getExeCommandName('UnitTests'))
    if ret != 0:
        print("build: exiting with error code = {}".format(ret))
        exit(ret)


def publish(config):
    logging.info("Publishing {name} version".format(name = config['name']))

    if platform.system() == 'Windows':
        awsExecutable = 'aws.cmd'
    elif platform.system() == 'Darwin':
        awsExecutable = 'aws'
    libraryName = BuildHelpers.getDynamicLibraryName('OsimisWebViewer')
    os.chdir(os.path.join(rootFolder, config['buildFolder'], 'Release'))

    # upload in a commitId folder
    CmdHelpers.runExitIfFails(
        "Uploading DLL to commitId folder",
        "{exe} s3 --region eu-west-1 cp {lib} s3://orthanc.osimis.io/{target}/viewer/{version}/ --cache-control max-age=1".format(
            exe = awsExecutable,
            lib = libraryName,
            target = config['webFolder'],
            version = commitId),
        stdoutCallback = logging.info)
    # upload in a branchName folder
    CmdHelpers.runExitIfFails(
        "Uploading DLL to branch folder",
        "{exe} s3 --region eu-west-1 cp {lib} s3://orthanc.osimis.io/{target}/viewer/{version}/ --cache-control max-age=1".format(
            exe = awsExecutable,
            lib = libraryName,
            target = config['webFolder'],
            version = args.branchName),
        stdoutCallback = logging.info)

    # upload in a version folder if current branch is master
    if (args.branchName == "master"):
        CmdHelpers.runExitIfFails(
            "Uploading DLL to branch folder",
            "{exe} s3 --region eu-west-1 cp {lib} s3://orthanc.osimis.io/{target}/viewer/{version}/ --cache-control max-age=1".format(
                exe = awsExecutable,
                lib = libraryName,
                target = config['webFolder'],
                version = taggedVersion),
            stdoutCallback = logging.info)

if __name__ == '__main__':

    for config in configs:
        if platform.system() == 'Windows' and not 'win' in config['webFolder']:
            continue
        if platform.system() == 'Darwin' and not 'osx' in config['webFolder']:
            continue

        if args.action == 'build':
            build(config)
        elif args.action == 'publish':
            publish(config)
        else:
            logging.info('invalid')

    logging.info('done')

    exit(0)
