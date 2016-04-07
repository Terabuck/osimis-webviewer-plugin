from helpers import LogHelpers
import logging
from osiBenchmark import Benchmark

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

if __name__ == '__main__':
    LogHelpers.configureLogging(logging.INFO)
    logger = LogHelpers.getLogger("Benchmark")

    benchmark = Benchmark(gzip=False, cache=False, trialCount=3)
    benchmark.time(instance='3ad3515c-cae5ec82-97f271ca-1e35e62d-a56ac7e2', frame=0, compression='jpeg95')
    benchmark.close()

    logger.info('done')



