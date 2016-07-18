# Osimis Web Viewer plugin

This project is a fork from [Orthanc WebViewer plugin](http://www.orthanc-server.com/static.php?page=web-viewer).  It adds measure tools, multiple series view and split-pane.  You may try it [here](http://osimisviewer.osimis.io)

This repo also contains a [Docker](https://www.docker.com/) container definition for Orthanc and all its main FOSS plugins including the Osimis WebViewer that you can find [here](https://hub.docker.com/r/osimis/orthanc-webviewer-plugin/builds/)

## Licensing

The Web viewer plugin for Orthanc is licensed under the AGPL license.

We also kindly ask scientific works and clinical studies that make
use of Orthanc to cite Orthanc in their associated publications.
Similarly, we ask open-source and closed-source products that make
use of Orthanc to warn us about this use. You can cite our work
using the following BibTeX entry:

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

## Usage

To use the docker container, follow [this procedure](https://bitbucket.org/snippets/osimis/eynLn).

## Pulling changes back from orthanc-webviewer-plugin
To retrieve changes from original mercurial repo to git fork, uses
- https://github.com/fingolfin/git-remote-hg

### Merging dev into master:

until we change the dev workflow :-)

- after a push in JS[dev], jenkins triggers a gulp build.
- merge JS[dev] in JS[master] (but it's actually not very useful since JS[master] is not really used)
- wait jenkins complete the generation of the JS[build-dev] branch ("compiled" JS) 
- wait jenkins updates C++[dev]/subtrees/osimis-webviewer with JS[build-dev]
- merge C++[dev] into C++[master] (keep in mind that the C++[master]/subtrees is actually pointing to JS[build-dev]

# JS build/

**Generated from Osimis Angular**

>*Opinionated Angular style guide for teams by [@john_papa](//twitter.com/john_papa)*

## Prerequisites

1. Install [Node.js](http://nodejs.org)
 - on OSX use [homebrew](http://brew.sh) `brew install node`
 - on Windows use [chocolatey](https://chocolatey.org/) `choco install nodejs`

2. Install ruby

3. Install compass

    ```
    gem update --system
    gem install compass
    ```

4. Install Yeoman `npm install -g yo`

5. Install these NPM packages globally

    ```
    npm install -g bower gulp
    ```

    >Refer to these [instructions on how to not require sudo](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md)

6. Install tests dependencies

    ```
    npm install -g nodemon marked jsonlint jshint eslint jscs phantomjs protractor karma-cli
    webdriver-manager update
    ```

## Running OsimisAngular

### Running in dev mode
 - Run the project with `gulp serve-dev`

 - opens it in a browser and updates the browser with any files changes.

### Building the project
 - Build the optimized project using `gulp build`
 - This create the optimized code for the project and puts it in the build folder

### Running the optimized code
 - Run the optimize project from the build folder with `gulp serve-build`

## Exploring OsimisAngular
OsimisAngular starter project

### Installing Packages
When you generate the project it should run these commands, but if you notice missing packages, run these again:

 - `npm install`
 - `bower install`

## Gulp Tasks

### Bower Files

- `gulp wiredep`

    Looks up all bower components' main files and JavaScript source code, then adds them to the `index.html`.

    The `.bowerrc` file also runs this as a postinstall task whenever `bower install` is run.

### Serving Development Code

- `gulp serve-dev --nosync --novet`

    Serves the development code without using browsersync, jscs & jslint.

### Building Production Code

- `gulp build`

    Copies all fonts, copies images and runs `gulp optimize` to build the production code to the build folder.

### Serving Production Code

- `gulp serve-build --nosync`

    Serve the optimized code from the build folder and manually launch the browser.

### Bumping Versions

- `gulp bump`

    Bump the minor version using semver.
    --type=patch // default
    --type=minor
    --type=major
    --type=pre
    --ver=1.2.3 // specific version

## License

MIT
