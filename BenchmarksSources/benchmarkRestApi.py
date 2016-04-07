import sys, platform, os, time

from orthancRestApi import OrthancClient
from orthancServer import OrthancServer
from helpers import LogHelpers
from datetime import datetime
from datetime import timedelta

import logging

# prerequisites:
#   - having orthanc db2
#   $ aws s3 sync s3://osimisviewerdicomfiles/orthancDb2 ../../orthanc_data_2 # install orthancDb2 - ~4GO
#
#   - creating virtual env
#   $ ./createPythonVenv.sh # install virtual env
#
#   - load virtual env
#   $ source env/bin/activate # source virtual env
#
#   - install python toolbox dependencies
#   $ pip install -r ../subtrees/pythonToolbox.git/requirements.txt
#
#   - building webviewer pro in release mode in the Build folder
#   $ mkdir ../Build
#   $ cd ../Build/
#   $ cmake .. -DCMAKE_BUILD_TYPE=Release -DALLOW_DOWNLOADS=ON -DSTATIC_BUILD=ON
#   $ make
#   $ cd BenchmarksSources
#
#   - opening orthanc with the provided orthanc.json
#   $ ../subtrees/binaries.git/Orthanc orthanc.json
#
#   - update orthanc.json to your local paths
#
# usage:
#   $ python benchmarkRestApi.py

# return avg time in milliseconds
class RestAPIBenchmark:
    client = None
    jpegCompression = 'jpeg95'
    trialCount = 100

    def __init__(self, client): 
        self.client = client

    def setCompression(self, jpegCompression):
        self.jpegCompression = jpegCompression

    def setTrialCount(self, trialCount):
        self.trialCount = trialCount

    def benchGetFrame(self, instanceId, frameIndex):
        url = "/web-viewer/instances/{compression}-{instanceId}_{frameIndex}"\
                .format(compression=self.jpegCompression, instanceId=instanceId, frameIndex=frameIndex)
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

if __name__ == '__main__':
    LogHelpers.configureLogging(logging.INFO)
    logger = LogHelpers.getLogger("Benchmark")

    OrthancServer.executablePath = './Orthanc';
    server = OrthancServer('ORTHANC_BCM', 'ORTHANC_BCM', 5111, 5080)
    server.launch('orthanc.json')

    client = OrthancClient('http://127.0.0.1:5080')

    print()

    benchmark = RestAPIBenchmark(client)
    benchmark.setCompression('jpeg95')
    benchmark.setTrialCount(3)
    benchmarkAvgTime = benchmark.benchGetFrame('3ad3515c-cae5ec82-97f271ca-1e35e62d-a56ac7e2', 0)

    print()
    print("== average time: " + str(benchmarkAvgTime))
    #print(str(benchmark.benchGetFrame('3ad3515c-cae5ec82-97f271ca-1e35e62d-a56ac7e2', 1))+'ms')

    includeOnco = True
    print()
    print()
    server.stop()

#    if includeOnco:
#        #PET-CT 1
#        anonymizeReplaceTags['PatientName'] = 'ONCO'
#        anonymizeReplaceTags['PatientID'] = '1234'
#        anonymizeReplaceTags['StudyDescription'] = 'PETCT_WholeBody_(Adult)'
#        anonymizeReplaceTags['StudyDate'] = '20130205'
#        anonymizeReplaceTags['SeriesDate'] = anonymizeReplaceTags['StudyDate']
#        anonymizeReplaceTags['ContentDate'] = anonymizeReplaceTags['StudyDate']
#
#        instanceIds = client.uploadFolder(os.path.join(baseDicomFilesPath, 'PET-CT EORTC/0573_baseline'))
#        studyId = client.getStudyIdForInstance(instanceIds[0])
#
#        client.anonymizeStudy(studyId = studyId,
#                              replaceTags = anonymizeReplaceTags,
#                              keepTags = ['SeriesDescription'],
#                              deleteOriginalStudy = True)
#
#        #PET-CT 2
#        anonymizeReplaceTags['StudyDescription'] = 'PETCT_WholeBody_(Adult)'
#        anonymizeReplaceTags['StudyDate'] = '20130812'
#        anonymizeReplaceTags['SeriesDate'] = anonymizeReplaceTags['StudyDate']
#        anonymizeReplaceTags['ContentDate'] = anonymizeReplaceTags['StudyDate']
#
#        instanceIds = client.uploadFolder(os.path.join(baseDicomFilesPath, 'PET-CT EORTC/0573_after2cycles'))
#        studyId = client.getStudyIdForInstance(instanceIds[0])
#
#        client.anonymizeStudy(studyId = studyId,
#                              replaceTags = anonymizeReplaceTags,
#                              keepTags = ['SeriesDescription'],
#                              deleteOriginalStudy = True)

    logger.info('done')



