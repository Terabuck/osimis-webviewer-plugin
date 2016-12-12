                             Archive Test Reports
-------------------------------------------------------------------------------

In order to be able to fulfill ISO13485 Web Viewer Pro's Test Procedure without
relaunching the Web Viewer Basic tests manually, WVB test reports have to be
logged at each WVB version release.

The WVB automatic tests are launched by the Continuous Integration System when
the project is built.

1.  Open the [jenkins' output](http://jenkins2.osidev.net/job/osimisWebViewer/job/master/lastBuild/consoleFull).

2.  Create a txt document in Osimis' Drive named
    `WVB-<VERSION> Archived Test Report.rtf` in the folder 
    `02-DND Conception/003-WVI web viewers/05-Verification & Validation/01-Functional tests/`.

3.  Copy Backend Unit Tests (search for `INFO:root:Running unit tests` and
    `[docker] test_cpp_`).

4.  Copy Frontend Unit Tests & Integration Tests (search for
    `[docker] test_js_`, it contains both integration & unit tests).

5.  Save the file.