# Demo

Docker image of the Osimis Web Viewer with dicom samples.

It includes:
- An orthanc instance with public-access configuration.
- The Osimis Web Viewer.
- Anonymized DICOM samples populated within Orthanc.
- A script to build the docker image.
- A script to deploy the docker image (used on our CI).
- A script to undeploy all the demo (used on our CI).