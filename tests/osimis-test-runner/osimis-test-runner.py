"""
Simple unit test runner,
- launch an orthanc server (optional)
- add dicom sample files
- launch karma (unit test runner) and start testing

Install:
	pyvenv env
	. env/bin/activate
	pip install -r requirements.txt

Usage:
	. env/bin/activate
	python osimis-test-runner.py [--auto-watch|-w] [--orthanc-path=|-p=] [--manual-orthanc|-m[=http://125.314.153.132:1653/]]

Example:
	python osimis-test-runner.py -w -p ../../backend/build/

Capture Orthanc (lldb + output):
	# retrieve orthanc pid
	export ORT_PID=`ps aux | grep Orthanc | awk '{ if ($11 ~ /build[^\/]*\/Orthanc$/) print $2}'` 
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
import time, os, re, sys, getopt, shlex, subprocess, json

# Parse command line attributes
argv = sys.argv[1:]
orthancFolder = os.path.realpath('./orthanc')
singleRun = True
launchOrthanc = True
orthancHost = 'localhost'
orthancHttpPort = 8042
uploadInstances = True
karmaExec = os.path.realpath('../../frontend/node_modules/karma/bin/karma')
karmaConf = os.path.realpath('./karma.conf.js')
frontendCwd = os.path.realpath('../../frontend/')
try:
	opts, args = getopt.getopt(argv, "hwp:m:", ["auto-watch", "orthanc-path=", "manual-orthanc="])
except getopt.GetoptError:
	print('Incorrect command: ')
	print('\t' + sys.argv)

	print('Usage:')
	print('\tpython osimis-test-runner.py [--auto-watch|-w] [--orthanc-path=|-p=] [--manual-orthanc|-m[=http://125.314.153.132:1653/]]')
	sys.exit(2)
for opt, arg in opts:
	if opt == '-h':
		print('Usage:')
		print('\tpython osimis-test-runner.py [--auto-watch|-w] [--orthanc-path=|-p=] [--manual-orthanc|-m[=http://125.314.153.132:1653/]]')
		sys.exit()
	elif opt in ("-w", "--auto-watch"):
		singleRun = False
	elif opt in ("-p", "--orthanc-path"):
		orthancFolder = os.path.realpath(arg)
	elif opt in ("-m", "--manual-orthanc"):
		pattern = re.compile(r"^https?\:\/\/([\w\.\:\-\[\]]+):(\d{0,5})\/?$"); # <host>:<port>
		hostAndPort = pattern.match(arg);
		if hostAndPort != None:
			orthancHost = hostAndPort.group(1)
			orthancHttpPort = int(hostAndPort.group(2))

		launchOrthanc = False

# Init Orthanc client
orthancUrl = 'http://' + orthancHost + ':' + str(orthancHttpPort)
client = OrthancClient(orthancUrl)

if launchOrthanc is True:
	# Download Orthanc server (if not in path)
	OrthancServer.loadExecutable(orthancFolder, OrthancServerVersion.NIGHTLY)

	# Init Orthanc server
	OrthancServer.executableFolder = orthancFolder
	server = OrthancServer('Files', 'Files', 7414, orthancHttpPort)
	server.config['HttpCompressionEnabled'] = False
	# server.setStdoutCallback(lambda msg: print('[ORT] ' + msg))
	server.addPlugin('OsimisWebViewer')
	server.launch()

if uploadInstances is True:
	# Uploading dicom files
	dicomSamplesFolder = 'dicom-samples/'

	# @todo use instances = client.uploadFolder(dicomSamplesFolder) once fixed
	instancesIds = []

	# Make atmost 5 attempts to upload files (until Orthanc is connected)
	for i in range(0, 5):
		# Upload all available instances to Orthanc
		try:
			for path in os.listdir(dicomSamplesFolder):
				# Ignore index.txt
				if path == 'index.txt':
					continue

				imagePath = os.path.join(dicomSamplesFolder, path)
				if os.path.isfile(imagePath) and '/.' not in imagePath:
					instancesIds.append(client.uploadDicomFile(imagePath))

			# List instances for testing purpose
			# print(colored('Instances:', 'blue'));
			# print(colored(json.dumps(instancesIds, sort_keys=True, indent=4), 'blue'));

		# Wait 5 seconds before retry on error
		except:
			print('Attempt Orthanc connexion #'+str(i))
			time.sleep(5)
			continue

		# Continue processing, upload has worked
		else:
			break

	# Upload didn't work after 5 attempts, exit
	else:
		# Print an error to stderr
		try:
			raise Exception('Unable to connect to Orthanc', orthancUrl)
		except Exception as e:
			print(e)
			sys.exit(-1)

# Pre process: dependency injection, angular template cache & SASS (because testing requires development-mode preprocessors to be applied)
# Wait for result before launching tests
# @warning this call destroys the frontend/build/ directory content!
gulp = subprocess.Popen(
	shlex.split('gulp inject'),
	cwd = frontendCwd
)
try:
	gulp.wait(timeout = 60*2 if singleRun else None) # kill after 2 min
except:
	print(colored('Error: gulp pre-processing took more than 2 minutes', 'red'))
	if launchOrthanc is True:
		server.stop()
	gulp.kill()
	sys.exit(50)

# Launch karma
karmaEnv = os.environ.copy()
karmaEnv["ORTHANC_URL"] = "http://" + orthancHost + ":" + str(orthancHttpPort) + "/"
karma = subprocess.Popen(
	shlex.split(karmaExec + ' start ' + karmaConf + (' --single-run' if singleRun else '')),
	cwd = frontendCwd, # set cwd path so bower.json can be found by karma.conf.js,
	env = karmaEnv
)

# Stop Orthanc once karma has fininshed
karmaReturnCode = None
try:
	karmaReturnCode = karma.wait(timeout = 60*3 if singleRun else None) # kill after 1 min
except:
	print(colored('Error: karma run took more than 3 minute', 'red'))
	
	# Print error if orthanc is no longer accessible
	try:
		client.getInstancesIdFromStudy('f4951629-35ef9e4b-ade74118-14bc0200-577786a5')
	except:
		print(colored('Error: Orthanc is no longer accessible from tests', 'red'))
	
	if launchOrthanc is True:
		server.stop()
	karma.kill()
	sys.exit(51)

# Print error if orthanc is no longer accessible
try:
	client.getInstancesIdFromStudy('f4951629-35ef9e4b-ade74118-14bc0200-577786a5')
except:
	print(colored('Error: Orthanc is no longer accessible from tests', 'red'))

if launchOrthanc is True:
	server.stop()

# Return karma exit status (for CI purpose)
sys.exit(karmaReturnCode)