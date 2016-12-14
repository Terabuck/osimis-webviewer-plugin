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

## Release Procedure

1.  Decide to release a new version of the WVB.

2.  Upgrade Orthanc Web Viewer source code (see 
    `procedures/merge-orthancwebviewer.md`, optional).

3.  Check SOUPs' release notes, upgrade them in case of potential issue for 
    the Web Viewer (optional).

4.  Create a specific release branch for the new Web Viewer Pro version.

5.  Choose the new version number using semvers.

6.  Bump the WVB versions in:

    * `frontend/bower.json`
    * `frontend/package.js`

7.  Update release notes. Include any breaking change in Public API!

8.  Build the WVB on that branch from Jenkins:

    * Open [jenkins](http://jenkins2.osidev.net/job/osimisWebViewer).
    * Run Branch Indexing.
    * Open the release branch's job:
      `http://jenkins2.osidev.net/job/osimisWebViewer/job/<WVB_RELEASE_BRANCH_NAME>/`
    * Launch a build if none have been launched during the Branch Indexing.

9.  Run tests (see `procedure/run-tests.md`).

10. Confirm the version release with a formal team meeting.

11. Merge the release branch in `master`. The release branch may be deleted
    at that point.

12. Tag the last master commit using `git tag -a x.y.z -m "x.y.z"`

13. From `dev` branch, merge `master` and push.

14. Trigger master build:

    * Open the [jenkins' master job](http://jenkins2.osidev.net/job/osimisWebViewer/job/master).
    * Launch a build.

15. Package plugin once master has been built:

    * Open [jenkins packaging job](http://jenkins2.osidev.net/job/orthanc/job/orthanc-mainline/job/master/).
    * Launch a build.
