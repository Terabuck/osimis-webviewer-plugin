#!/usr/bin/python

#
# This maintenance script updates the content of the "Orthanc" folder
# to match the latest version of the Orthanc source code.
#

import multiprocessing
import os
import stat
import urllib2

TARGET = os.path.dirname(__file__)
ORTHANC_FRAMEWORK_VERSION = '1.7.1'
PLUGIN_SDK_VERSION = '1.3.1'
REPOSITORY = 'https://hg.orthanc-server.com/orthanc/raw-file'

FILES = [
    ('Resources/DownloadOrthancFramework.cmake', 'CMake'),
    ('Resources/LinuxStandardBaseToolchain.cmake', 'CMake'),
]

SDK = [
    'orthanc/OrthancCPlugin.h',
]


def Download(x):
    branch = x[0]
    source = x[1]
    target = os.path.join(TARGET, x[2])
    print target

    try:
        os.makedirs(os.path.dirname(target))
    except:
        pass

    url = '%s/%s/%s' % (REPOSITORY, branch, source)

    with open(target, 'w') as f:
        try:
            f.write(urllib2.urlopen(url).read())
        except:
            print('ERROR %s' % url)
            raise


commands = []

for f in FILES:
    commands.append([ 'Orthanc-%s' % ORTHANC_FRAMEWORK_VERSION,
                      f[0],
                      os.path.join(f[1], os.path.basename(f[0])) ])

for f in SDK:
    commands.append([
        'Orthanc-%s' % PLUGIN_SDK_VERSION, 
        'Plugins/Include/%s' % f,
        '../Orthanc/Sdk-%s/%s' % (PLUGIN_SDK_VERSION, f) 
    ])


pool = multiprocessing.Pool(10)  # simultaneous downloads
pool.map(Download, commands)
