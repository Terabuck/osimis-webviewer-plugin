# Osimis Web Viewer

The [Osimis'](htpp://www.osimis.io/) Web Viewer provides medical image 
visualization straight from the browser.

It is distributed as a plugin to [Orthanc](http://www.orthanc-server.com/). In 
other words, the viewer can be connected to most modalities, but also leveraged
through Orthanc's strong architectural extensibility.

2D rendering is supported with the usual tools:

- Zooming
- Panning
- Windowing
- Length Measurement
- Angle Measurement
- Point/Circle/Rectangle of Interest
- Image Flipping/Rotation
- Multiframe support

Have a look at [our blog](http://www.osimis.io/en/blog.html).

## Demo

A demo of the viewer is available at those links:

- [IRM study](http://osimisviewer.osimis.io/osimis-viewer/app/index.html?study=1b4c72ad-5aba2557-9fc396b3-323e190c-07d36585).
- [Full demo](http://osimisviewer.osimis.io/), embedded within the Orthanc
  Explorer. Other studies are available from there.

## What's new

See the [release notes](https://bitbucket.org/osimis/osimis-webviewer-plugin/src/master/RELEASE_NOTES.txt).

## Installation & Usage

The latest stable version is available [here](http://www.osimis.io/en/download.html).

Nightly builds are available [here](http://orthanc.osimis.io/#/nightly).
They are still unstable at the moment.

We recommend to download the binaries for Windows and Mac OS X & the docker
image for Linux.

[This article](http://www.osimis.io/en/blog/2016/06/03/deploy-Orthanc-on-a-PC-in-38-seconds.html)
details the installation process on Windows.

[This procedure](https://bitbucket.org/snippets/osimis/eynLn) details the
docker image installation process on Linux.

For Mac OS X, the procedure is very similar to the windows' one. Unzip the
downloaded folder and double click on the `startOrthanc.command` file.

## Configuration

Orthanc is configurable via a [JSON file](https://orthanc.chu.ulg.ac.be/book/users/configuration.html).
This plugin provide a few optional options as well.

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
    // Show the `download study` button in the frontend.
    // You may want to disable this feature if you disable access to
    // the underlying REST route for authentication reasons.
    // Default: true
    "StudyDownloadEnabled": true,

    // Display MPEG-4 DICOM video (non-bd only) within the frontend. You
    // may disable this feature if you disable access to the underlying
    // REST route for authentication reasons.
    // Default: true
    "VideoDisplayEnabled": true,

    // Store image annotations made by users as Orthanc Attachment 9999 and
    // retrieve them autommatically each time the viewer is opened.
    // Default: false
    "AnnotationStorageEnabled": false,

    // This option displays a button on each viewport. When the user clicks 
    // on the button, a new DICOM series is created with the image of the
    // viewport, including the annotations. You must ensure your server allows
    // large requests. You must also includes a new dicom tag in the
    // dictionary (see the Dictionary json attribute below).
    // Default: false
    "KeyImageCaptureEnabled": false
  },
  "Dictionary" : {
    // Tag required when setting `KeyImageCaptureEnabled` to true.
    "7331,1000" : [ "LT", "OsimisNote", 1, 1 ]
  }
}
```

## Licensing

The Osimis' Web Viewer is licensed under the AGPL license. See the COPYING
file.
We also kindly ask scientific works and clinical studies that make use of
Orthanc to cite Orthanc in their associated publications. Similarly, we ask
open-source and closed-source products that make use of Orthanc to warn us
about this use. You can cite S. Jodogne's work using the following BibTeX
entry:

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

## Contact & Bug/Feedback Report

Any question/feedback/bug report are well appreciated. You may send them by mail to osimis' developer Thibault Piront at `tp@osimis.io`.

The full bug/feedback report procedure is available in the 
`procedures/report-bug-or-feedback.md` file.

## Authentification Proxy Development & Plugin's routes

See the `procedures/develop-auth-proxy.md` file.

## Development

### Folder structure

Six folders are available at the root:

- `backend/` contains the C++ plugin source code (& cmake build process).
- `frontend/` contains the HTML/JavaScript source code (& gulp build process).
- `reverse-proxy/` contains a security proxy blocking Orthanc non-GET requests.
- `demo/` contains a standalone docker, proxied version of orthanc and the
  viewer with sample files.
- `scripts/` contains global demo building scripts, it is mostly used by the
  Continuous Integration System. It also contains scripts to build/run the web
  viewer demo in a docker environment.
- `tests/` contains the integration tests.

### Build

See the `procedures/bootstrap-dev-environment.md` file.

### Development

See the `procedures/bootstrap-dev-environment.md` file.

### Testing

See the `procedures/run-tests.md` file.

### Release procedure

See the `procedures/release-version.md` file. The
`procedures/archive-test-reports.md` file will be mentionned.

### Pulling changes back from orthanc-webviewer-plugin

See the `procedures/merge-orthancwebviewer.md` file.
