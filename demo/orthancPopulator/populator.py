import argparse
import os

import time

import sys
from orthancRestApi import NoResponseReceivedException
from orthancRestApi import OrthancClient


def main(orthancUrl):
    """
        Short script that will upload all samples in the folder ./orthancSamples in orthanc
    """
    orthanc = OrthancClient(rootUrl = orthancUrl)
    isOrthancAvailable = False
    i = 0

    while not isOrthancAvailable and i < 10:
        print("trying to detect orthanc")
        i += 1
        try:
            studies = orthanc.getStudiesId()
            print('orthanc available')
            isOrthancAvailable = True
        except NoResponseReceivedException:
            print('orthanc not available retrying in 1 minute')
            time.sleep(1)

    if i == 10:
        print('failed connect to orthanc')
        return

    print('uploading samples instances')
    orthancSampleDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), 'orthancSamples'))
    orthanc.uploadFolder(orthancSampleDirectory)

if __name__ == "__main__":
    parser = argparse.ArgumentParser("Populate an orthanc with the default demo samples")
    parser.add_argument('-u', '--orthanc-url', help="the orthancUrl used for the build", default = None)
    args = sys.argv
    args = parser.parse_args(args[1:])
    main(args.orthanc_url)
