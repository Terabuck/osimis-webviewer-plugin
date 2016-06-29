"""
Simple unit test runner,
- launch an orthanc server
- add dicom sample files
- launch karma (unit test runner) and start testing

Install:
- pyvenv env
- . env/bin/activate
- pip install -r requirements.txt

Usage:
- . env/bin/activate
- python osimis-test-runner.py [--auto-watch|-w] [--orthanc-path=|-p=]

Example:
- python osimis-test-runner.py -w -p ../../osimis-webviewer-plugin/BuildDev/
"""

from orthancServer import OrthancServer, OrthancServerVersion
from orthancRestApi import OrthancClient
from helpers import LogHelpers
from termcolor import colored
import logging
import os, sys, getopt, shlex, subprocess, json

# Parse command line attributes
argv = sys.argv[1:]
orthancFolder = os.path.realpath('./orthanc')
singleRun = True
try:
	opts, args = getopt.getopt(argv, "hwp:", ["auto-watch", "orthanc-path="])
except getopt.GetoptError:
	print('osimis-test-runner.py -w')
	sys.exit(2)
for opt, arg in opts:
	if opt == '-h':
		print('osimis-test-runner.py -w')
		sys.exit()
	elif opt in ("-w", "--auto-watch"):
		singleRun = False
	elif opt in ("-p", "--orthanc-path"):
		orthancFolder = os.path.realpath(arg)

dicomSamplesFolder = 'dicom-samples/'
orthancPort1 = 7414
orthancPort2 = 8042 # http port

# Download Orthanc server (if not in path)
OrthancServer.loadExecutable(orthancFolder, OrthancServerVersion.NIGHTLY)

# Init Orthanc server
OrthancServer.executableFolder = orthancFolder
server = OrthancServer('Files', 'Files', orthancPort1, orthancPort2)
server.config['HttpCompressionEnabled'] = False
server.setStdoutCallback(lambda msg: print('[ORT] ' + msg))
server.addPlugin('OsimisWebViewer')
server.launch()

# Init Orthanc client
client = OrthancClient('http://127.0.0.1:' + str(orthancPort2))

# Uploading dicom files
# @todo use instances = client.uploadFolder(dicomSamplesFolder) once fixed
instancesIds = []
for path in os.listdir(dicomSamplesFolder):
    imagePath = os.path.join(dicomSamplesFolder, path)
    print(imagePath)
    if os.path.isfile(imagePath) and '/.' not in imagePath:
        instancesIds.append(client.uploadDicomFile(imagePath))

# List instances for testing purpose
print(colored('Instances:', 'blue'));
print(colored(json.dumps(instancesIds, sort_keys=True, indent=4), 'blue'));

# Launch karma
karma = subprocess.Popen(
	shlex.split('./node_modules/karma/bin/karma start karma.conf.js' + (' --single-run' if singleRun else '')),
	cwd = '..' # set cwd path to ../ so bower.json can be found by karma.conf.js
)

# Stop Orthanc once karma has fininshed
karmaReturnCode = None
try:
	karmaReturnCode = karma.wait(timeout = 60*5 if singleRun else None) # kill after 5 min
except:
	print(colored('error: karma timeout expired', 'red'))
	server.stop()
	karma.kill()
	sys.exit(1)

server.stop()

# Exit the script with error if karma failed (for CI purpose)
if karmaReturnCode != 0:
	sys.exit(1)
