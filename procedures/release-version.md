                                Release Procedure
-------------------------------------------------------------------------------

Semantic Versioning is used to determine release version numbers (see
[semver](http://semver.org/)).

The Web Viewer Basic lies at the boundaries between a Library and an
Application. It is therefore required to determine what we consider to be 
the _Public API_ of the viewer.

## Public API

The WVB Public API contains any interface which may breaks WVB integration
in case of change. All the HTTP routes specified in
`procedures/develop-auth-proxy.md` represent this Public API. The frontend
components are not considered as Public API, even if they can be used as
such.

## Index

The following items referes to Web Viewer Pro's ISO13485-related  files. They 
are available from the Osimis' private Google Drive. It is best to keep them 
in sync with the latest Web Viewer Basic versions to keep the development lean.

- _User Requirements_: User Requirements of the Web Viewer Pro. These should
  be kept in sync with the Web Viewer Basic ones for maintainability's sake.
  `02-DND Conception/003-WVI web viewers/01-Device Description/03-Requirements/E-DND-02 Design Input & Traceability Matrix.xlsx`.

- _Risk Assessment Report_: Risk Analysis of the Web Viewer Pro. The risk
  should be pretty similar in WVB and WVP as the components are mostly 
  identical.
  `02-DND Conception/003-WVI web viewers/04-Risk Assessment/E-DND-05 Risk Assessment Report.xlsx`.

- _Test Plan_: Test Plan of the Web Viewer Pro. It contains both the WVB and
  WVP's automatic tests' results.
  `02-DND Conception/003-WVI web viewers/05-Verification & Validation/01-Functional tests/E-DND-03 Test Plan.xls`.

- _System Architecture Description_: The architecture of the Web Viewer Pro.
  as the Web Viewer Basic is considered as a core library for the Web Viewer
  Pro, its architecture is also described there.
  `02-DND Conception/003-WVI web viewers/03-Design & Development/00-Architecture/E-DND-06 system-architecture-description.docx`.

## Release Procedure

1.  Decide to release a new version of the WVB.

2.  Upgrade Orthanc Web Viewer source code (see 
    `procedures/merge-orthancwebviewer.md`, optional).

3.  Check SOUPs' release notes, upgrade them in case of potential issue for 
    the Web Viewer (optional).

4.  Check the WVP's _User Requirements_ matches the latest WVB's features/
    risk mitigations (optional).

5.  Check the WVP's _Risk Assessment Report_ risk analysis has been done for 
    the latest WVB's features/bug fixes/bug found (optional).

6.  Check the WVP's _Test Plan_ tests the latest WVB's features/bug fixes
    (optional).

7.  Check the WVP's _System Architecture Description_ matches the latest WVB's
    design changes (optional).

8.  Create a specific release branch for the new Web Viewer Pro version.

9.  Choose the new version number using semvers.

10. Bump the WVB versions in:

    * `frontend/bower.json`
    * `frontend/package.js`

11. Update release notes. Include any breaking change in Public API!

12. Build the WVB on that branch from Jenkins:

    * Open [jenkins](http://jenkins2.osidev.net/job/osimisWebViewer).
    * Run Branch Indexing.
    * Open the release branch's job:
      `http://jenkins2.osidev.net/job/osimisWebViewer/job/<WVB_RELEASE_BRANCH_NAME>/`
    * Launch a build if none have been launched during the Branch Indexing.

13. Run tests (see `procedure/run-tests.md`).

14. Confirm the version release with a formal team meeting.

15. Merge the release branch in `master`. The release branch may be deleted
    at that point.

16. Tag the last master commit using `git tag -a x.y.z -m "x.y.z"`

17. From `dev` branch, merge `master` and push.

18. Trigger master build:

    * Open the [jenkins' master job](http://jenkins2.osidev.net/job/osimisWebViewer/job/master).
    * Launch a build.

19. *Archive test reports* (see `procedures/archive-test-reports.md`).

20. Package plugin once master has been built:

    * Open [jenkins packaging job](http://jenkins2.osidev.net/job/orthanc/job/orthanc-mainline/job/master/).
    * Launch a build.
