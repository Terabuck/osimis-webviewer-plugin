from buildHelpers import BuildHelpers
import logging
import platform
import os
import shutil
from subprocess import call
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("branchName")
args = parser.parse_args()

rootFolder = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..')

logger = logging.getLogger()

builds = [{
	'name' : "64bits",
	'builder' : BuildHelpers.BUILDER_VS2015_64BITS,
	'buildFolder' : "build/build64"
	},
	{
	'name' : "32bits",
	'builder' : BuildHelpers.BUILDER_VS2015_32BITS,
	'buildFolder' : "build/build32"
}]

for build in builds:
	logger.info("Building {name} version".format(name = build['name']))

	buildFolder = os.path.join(rootFolder, build['buildFolder'])
	os.makedirs(buildFolder, exist_ok = True)
	os.chdir(buildFolder)
	shutil.rmtree(buildFolder, ignore_errors = True)

	ret = BuildHelpers.buildCMake(cmakeListsFolderPath = os.path.join(rootFolder, 'backend'),
	                              buildFolderPath = buildFolder,
	                              cmakeTargetName = 'OsimisWebViewer',
	                              cmakeArguments = ["-DJS_FRONTEND_VERSION={}".format(args.branchName)],
	                              builder = build['builder'],
	                              config = BuildHelpers.CONFIG_RELEASE
	                              )
	if ret != 0:
		exit(ret)

	logger.info("Running unit tests ({name})".format(name = build['name']))

	os.chdir(os.path.join(buildFolder, 'Release'))
	ret = call('UnitTests.exe')
	if ret != 0:
		exit(ret)


# rem python %startScriptDir%\buildHelpers.py --cmakeFolder=%backendFolder% --buildFolder=%cd% --target=OsimisWebViewer
# rem if %errorlevel% neq 0 exit /b %errorlevel%

# rem # run the unit tests
# rem cd Release
# rem UnitTests.exe

# rem if %errorlevel% neq 0 exit /b %errorlevel%


# rem echo "==========================="
# rem echo "Building the 32bits version"
# rem echo "==========================="

# rem cd %startScriptDir%
# rem cd ..\backend

# rem rm -rf build32/
# rem mkdir build32
# rem cd build32

# rem python %startScriptDir%\buildHelpers.py --cmakeFolder=%backendFolder% --buildFolder=%cd% --target=OsimisWebViewer
# rem if %errorlevel% neq 0 exit /b %errorlevel%

# rem # Build the plugin
# rem cmake .. -G "Visual Studio 14 2015"
# rem "C:\Program Files (x86)\MSBuild\14.0\Bin\MSBuild.exe" OsimisWebViewer.sln /t:Build /maxcpucount /p:Configuration=Release


exit(0)
ret = BuildHelpers.buildCMake(os.path.join(rootDirectory, repository['localName'], build['buildFromFolder']),
                              os.path.join(rootDirectory, repository['localName'], build['buildOutputFolder']),
                              build['cmakeTarget'],
                              build['cmakeOptions'],
                              builder,
                              config,
                              cmakeTargetsOSX = build['cmakeTargetsOSX'] if 'cmakeTargetsOSX' in build else None
                              )

if ret != 0:
	logging.error('Error while Building {0}'.format(repositoryName))
	exit(ret)
