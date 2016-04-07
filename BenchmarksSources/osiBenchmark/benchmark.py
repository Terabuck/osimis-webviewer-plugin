from datetime import datetime
from datetime import timedelta

from orthancRestApi import OrthancClient
from orthancServer import OrthancServer

OrthancServer.executablePath = './Orthanc';

class Benchmark:
	client = None
	# gzip = False
	# cache = False
	trialCount = 1

	def __init__(self, gzip, cache, trialCount):
		self.server = OrthancServer('ORTHANC_BCM', 'ORTHANC_BCM', 5111, 5080)
		self.server.launch('orthanc.json')
		print()

		self.client = OrthancClient('http://127.0.0.1:5080')

		# self.gzip = gzip
		# self.cache = cache
		self.trialCount = trialCount

	def time(self, instance, frame, compression):
		url = "/web-viewer/instances/{compression}-{instance}_{frame}"\
			.format(compression=compression, instance=instance, frame=frame)

		avgTime = self.__measureRequestTime(url)

		return avgTime

	def __measureRequestTime(self, relativeUrl):
		totalTimeDelta = timedelta(0, 0, 0)
		for x in range(0, self.trialCount):
			print()
			print("-- new trial")

			start = datetime.now()
			self.client.getRequest(relativeUrl)
			end = datetime.now()

			timeDelta = end - start
			print("=> trial time: " + str(timeDelta))

			totalTimeDelta += timeDelta

		averageTimeDelta = totalTimeDelta / self.trialCount
		return averageTimeDelta

	def close(self):
		print()
		print()
		self.server.stop()