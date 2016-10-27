# Osimis Web Viewer Plugin

The [Osimis'](htpp://www.osimis.io/) Web Viewer provides medical image visualization straight from the browser.

It is distributed as a plugin to [Orthanc](http://www.orthanc-server.com/). In other words, the viewer can be connected to most modalities, but also leveraged through Orthanc's strong architectural extensibility.

2D rendering is supported with the most usual tools:
- Zooming
- Panning
- Windowing
- Length Measurement
- Angle Measurement
- Point/Circle/Rectangle of Interest
- Image Flipping/Rotation
- Multiframe support

You may try the latest stable version [here](http://osimisviewer.osimis.io).

## What's new

See the [release notes](https://bitbucket.org/osimis/osimis-webviewer-plugin/src/master/RELEASE_NOTES.txt).

## Installation & Usage

The latest stable version is available on the [Osimis website](http://www.osimis.io/en/download.html). We recommend to download the binaries for Windows and Mac OS X & the docker image for Linux.

[This article](http://www.osimis.io/en/blog/2016/06/03/deploy-Orthanc-on-a-PC-in-38-seconds.html) details the installation process on Windows.

[This procedure](https://bitbucket.org/snippets/osimis/eynLn) details the docker image installation process on Linux.

For Mac OS X, the procedure is very similar to the windows' one. Unzip the downloaded folder and double click on the startOrthanc.command file. 

## Configuration

Orthanc is configurable via a [JSON file](https://orthanc.chu.ulg.ac.be/book/users/configuration.html). This plugin provide a few optional options as well.

```json
{
  /**
   * General configuration of Orthanc
   **/

  /* ... (see the Orthanc documentation for the other options) ... */

  /**
   * Orthanc options having significant impact on the Web Viewer
   **/

  // Enable the HTTP server. If this parameter is set to "false",
  // Orthanc acts as a pure DICOM server. The REST API and Orthanc
  // Explorer will not be available.
  "HttpServerEnabled" : true,

  // HTTP port for the REST services and for the GUI
  "HttpPort" : 8042,

  // When the following option is "true", if an error is encountered
  // while calling the REST API, a JSON message describing the error
  // is put in the HTTP answer. This feature can be disabled if the
  // HTTP client does not properly handles such answers.
  "HttpDescribeErrors" : true,

  // Enable HTTP compression to improve network bandwidth utilization,
  // at the expense of more computations on the server. Orthanc
  // supports the "gzip" and "deflate" HTTP encodings.
  // May be disabled to avoid useless image recompression overhead.
  "HttpCompressionEnabled" : true,

  // Set the timeout for HTTP requests issued by Orthanc (in seconds).
  "HttpTimeout" : 10,

  // Whether remote hosts can connect to the HTTP server
  // In development mode, useful to set to true when using docker on OSX.
  "RemoteAccessAllowed" : false,
  
  // The maximum number of active jobs in the Orthanc scheduler. When
  // this limit is reached, the addition of new jobs is blocked until
  // some job finishes.
  "LimitJobs" : 10,

  // Enable or disable HTTP Keep-Alive (deprecated). Set this option
  // to "true" only in the case of high HTTP loads.
  "KeepAlive" : false,

  "Plugins" : [
    // Uncomment one of the following lines according to your platform.  
    // Update the path to the DLL on your system.  The path is relative to the working folder
    // Orthanc will start from.  If you are unsure what the working folder is,
    // use and absolute path
    
    // "C:\\Program Files (x86)\\Orthanc\\Orthanc Server 1.1.0\\OsimisWebViewer.dll" // for Windows 
    // "libOsimisWebViewer.so" // for Linux
    // "libOsimisWebViewer.dylib" // for OSX
  ],

  /**
   * Osimis WebViewer Configuration
   **/
  "WebViewer" : {
    // Cache the compressed images on the file system.
    // Takes more disk space but allow faster image rendering when the
    // image is viewed multiple times.
    // Default: false
    "CacheEnabled" : false,
    
    // Decode instances using GDCM instead of the builtin Orthanc decoder.
    // GDCM may sometimes be slower but Orthanc's builtin decoder doesn't 
    // support every format.
    // Default: true
    "GdcmEnabled" : true,

    // When the RestrictTransferSyntaxes field is present: GDCM will be used
    // to decode the transfer syntaxes listed in the array. All other transfer
    // syntaxes will be decoded by the Orthanc's builtin decoder. When the
    // RestrictTransferSyntaxes field is not present: GDCM will be used to
    // decode all transfer syntaxes.
    // Default: undefined
    "RestrictTransferSyntaxes": [
      /* Transfer Syntax UID Transfer Syntax name */
      //  JPEG 2000 Image Compression (Lossless Only)
      "1.2.840.10008.1.2.4.90",
      //  JPEG 2000 Image Compression
      "1.2.840.10008.1.2.4.91",
      //  JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
      "1.2.840.10008.1.2.4.92",
      //  JPEG 2000 Part 2 Multicomponent Image Compression
      "1.2.840.10008.1.2.4.93"
    ]
  }
}
```

## Licensing

The Web viewer plugin for Orthanc is licensed under the AGPL license.

See the COPYING file.

We also kindly ask scientific works and clinical studies that make
use of Orthanc to cite Orthanc in their associated publications.
Similarly, we ask open-source and closed-source products that make
use of Orthanc to warn us about this use. You can cite S. Jodogne's work
using the following BibTeX entry:

```
@inproceedings{Jodogne:ISBI2013,
author = {Jodogne, S. and Bernard, C. and Devillers, M. and Lenaerts, E. and Coucke, P.},
title = {Orthanc -- {A} Lightweight, {REST}ful {DICOM} Server for Healthcare and Medical Research},
booktitle={Biomedical Imaging ({ISBI}), {IEEE} 10th International Symposium on}, 
year={2013}, 
pages={190-193}, 
ISSN={1945-7928},
month=apr,
url={http://ieeexplore.ieee.org/xpl/articleDetails.jsp?tp=&arnumber=6556444},
address={San Francisco, {CA}, {USA}}
}
```

## Development

### Folder structure

4 folders are available at the root:
- backend/ contains the C++ plugin source code (& cmake build process)
- frontend/ contains the HTML/JavaScript source code (& gulp build process)
- scripts/ contains building scripts used by the continuous integration.
- tests/ contains the integration tests.

### Backend Development Process 

For manual build instructions of the C++ plugin on Mac OS & Linux, the following commands provides the debug flag and add benchmark logs:

```shell
$ cd backend/
$ mkdir build
$ cd build/
$ cmake .. -DCMAKE_BUILD_TYPE=Debug -DALLOW_DOWNLOADS=ON -DSTANDALONE_BUILD=ON -DSTATIC_BUILD=ON -DBENCHMARK=1
$ make -j2
```

You can also have a look at the _scripts/_ folder and the _backend/Resource/BuildInstructions.txt_ file.

The backend will embed the _frontend/build/_ folder or download it if unavailable.

Known issues:
- make sure the _frontend/build/_ folder is full (_js/app.js_ and _js/lib.js_ files must be available). The command _gulp serve-build_ may corrupt it (see _Frontend Development Process_ section).

### Frontend Development Process

Frontend can either be built or launch in development mode. 

For build instructions, you can use docker. Please refer to _scripts/_ and _frontend/scripts/_ folders. You can also use the manual procedure.

For development instructions, you must use the manual procedure.

Manual procedure requires a few dependencies.

#### Prerequisites

1. Install [Node.js](http://nodejs.org)
 - on OSX use [homebrew](http://brew.sh) `brew install node`
 - on Windows use [chocolatey](https://chocolatey.org/) `choco install nodejs`

2. Install ruby

3. Install other dependencies

See the following scripts:

```shell
    cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"
    ./scripts/userInstallAdditionalDevTools.sh
```

    >Refer to these [instructions on how to not require sudo](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md)

#### Build instructions

As an alternative to docker, you can use the following commands to build the frontend.

```shell
cd frontend/
# install npm & bower dependencies
npm install
bower install
# generate build/ folder
gulp build
```

#### Dev instructions

It is not required to rebuild the backend to develop the frontend. These commands launch the frontend development server outside of Orthanc.

```shell
cd frontend/
# install npm & bower dependencies
npm install
bower install
# launch development server 
gulp serve-dev --nosync --novet
```

The file _frontend/server.js_ provides a proxy to the Orthanc server. You may want to change the defined port/ip. You can also use a CORS enabler plugin (for your browser) and change the Orthanc url in the _frontend/src/config.js_ file. 

You may need to set the "RemoteAccessAllowed" configuration option to true in your Orthanc config.json file.

Known issues:
- the serve-dev command erases the _build/_ folder content.
- the server must be restarted to update index.html or plugin-entrypoint.html files.

### Testing

See comments for testing instruction in tests/osimis-test-runner/osimis-test-runner.py.

The prerequisites are detailled in the _Frontend Development Process_ section. 

Unstables may be tested directly from [docker images](https://hub.docker.com/r/osimis/orthanc-webviewer-plugin/builds/) as well.

### Pulling changes back from orthanc-webviewer-plugin

This repository is a fork of orthanc-webviewer-plugin.

To retrieve changes from original mercurial repository, use [git-remote-hg](https://github.com/fingolfin/git-remote-hg)


### Releasing (Osimis internal procedure)

- merge all your changes in the dev branch
- docker build will trigger automatically (:dev tag).  Win/OSX builds will trigger during the night.  You may trigger them by hand on Jenkins 1.  The OrthancMainline builds contain the OsimisWebViewer dev branch.  Note that the Win/OSX build slaves are very unstable, you might need to restart the builds ...
- perform a smoke test of each version
- if everything is fine, merge dev into master.  Make sur to merge the commit you have validated (someone might have merged another feature since you started your validation)
- update the versions in `frontend/bower.json`, `frontend/package.js` and `frontend/src/app/config.provider.js`
- update the release notes in master (review all feature branch merges since the last merge from dev into master)
- commit
- create a new tag with 'git tag -a 0.4.1 -m "0.4.1"'
- push
- manual master build has to be trigger from jenkins 2 (it will includes the frontend and docker :latest & :0.4.1 tags).  Win/OSX builds will trigger during the night.  You may trigger them by hand on Jenkins 1 once the front-end build has finished.  The OrthancStable builds contain the OsimisWebViewer master branch.
- from dev branch, rebase master and push

### Plugin's routes

The plugin propose severals GET HTTP routes.

These routes are considered unstable and may change often between MAJOR versions.

- Retrieve an image (embedded in KLV format, see source code for detailed format informations - use 0 for monoframe instances).

```
/osimis-viewer/images/<instance_uid:str>/<frame_index:int>/{low|medium|high|pixeldata}-quality
```

- Provide informations about a series:

```
/osimis-viewer/series/<series_uid:str>
```

- Provide configuration for frontend
```
/osimis-viewer/config
```

The following Orthanc routes are also used:

```
/studies/
/studies/<uid>
/instances/<uid>/simplified-tags
/plugins/osimis-web-viewer
/system
/series/<uid>/study
```
