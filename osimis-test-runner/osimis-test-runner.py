"""
Simple unit test runner,
- launch an orthanc server
- add dicom sample files
- launch karma (unit test runner) and start testing

Install:
	pyvenv env
	. env/bin/activate
	pip install -r requirements.txt

Usage:
	. env/bin/activate
	python osimis-test-runner.py [--auto-watch|-w] [--orthanc-path=|-p=]

Example:
	python osimis-test-runner.py -w -p ../../osimis-webviewer-plugin/BuildDev/

Capture Orthanc (lldb + output):
	# retrieve orthanc pid
	export ORT_PID=`ps aux | grep Orthanc | awk '{ if ($11 ~ /Build[^\/]*\/Orthanc$/) print $2}'` 
	# attach lldb
	lldb -p $ORT_PID
	proc handle SIGPIPE -s FALSE
	c
	# ... see
	# http://stackoverflow.com/questions/3425340/how-can-i-capture-the-stdout-from-a-process-that-is-already-running 
	# & make sure to replace arg0 == 1 w/ ( arg0 == 1 || arg0 == 2 ) (for stderr listening)
	capture $ORT_PID
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
launchOrthanc = True
orthancHTTPPort = 8042
try:
	opts, args = getopt.getopt(argv, "hwp:m", ["auto-watch", "orthanc-path=", "manual-orthanc"])
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
	elif opt in ("-m", "--manual-orthanc"):
		launchOrthanc = False

# Init Orthanc client
client = OrthancClient('http://127.0.0.1:' + str(orthancHTTPPort))

if launchOrthanc is True:
	dicomSamplesFolder = 'dicom-samples/'

	# Download Orthanc server (if not in path)
	OrthancServer.loadExecutable(orthancFolder, OrthancServerVersion.NIGHTLY)

	# Init Orthanc server
	OrthancServer.executableFolder = orthancFolder
	server = OrthancServer('Files', 'Files', 7414, orthancHTTPPort)
	server.config['HttpCompressionEnabled'] = False
	# server.setStdoutCallback(lambda msg: print('[ORT] ' + msg))
	server.addPlugin('OsimisWebViewer')
	server.launch()

	# Uploading dicom files
	# @todo use instances = client.uploadFolder(dicomSamplesFolder) once fixed
	instancesIds = []
	for path in os.listdir(dicomSamplesFolder):
	    imagePath = os.path.join(dicomSamplesFolder, path)
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
	if launchOrthanc is True:
		server.stop()
	karma.kill()
	sys.exit(051)

if launchOrthanc is True:
	server.stop()

# Return karma exit status (for CI purpose)
sys.exit(karmaReturnCode)