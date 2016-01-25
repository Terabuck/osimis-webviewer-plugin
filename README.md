# Orthanc for Docker
[Docker Hub](https://www.docker.com/) repository to build [Orthanc](http://www.orthanc-server.com/) with osimis webviewer plugin. Orthanc is a lightweight, RESTful Vendor Neutral Archive for medical imaging.

## Usage

The following command will run the core of Orthanc:

```
# docker run -p 4242:4242 -p 8042:8042 --rm osimis/osimis
```

Once Orthanc is running, use Mozilla Firefox at URL [http://localhost:8042/](http://orthanc:orthanc@localhost:8042/app/explorer.html) to interact with Orthanc. The default username is `orthanc` and its password is `orthanc`.

You should specify an external directory to prevent your orthanc database to be deleted when the docker image is updated.

```
docker run -p 4242:4242 -p 8042:8042 --rm osimis/osimis -v ./data_directory:/var/lib/orthanc/db
```

For security reasons, you should protect your instance of Orthanc by changing this default user, in the `RegisteredUsers` configuration option. You can use a custom [configuration file](https://orthanc.chu.ulg.ac.be/book/users/configuration.html) for Orthanc as follows:

```
# docker run --rm --entrypoint=cat osimis/osimis /etc/orthanc/orthanc.json > /tmp/orthanc.json
  => Edit /tmp/orthanc.json
  => Modify the RegisteredUsers section
# docker run -p 4242:4242 -p 8042:8042 --rm -v /tmp/orthanc.json:/etc/orthanc/orthanc.json:ro osimis/osimis
```

## Updating orthanc to the latest version

```
(note: Remove datas by default. Use the volume instruction when running docker image !)
docker pull osimis/osimis:latest
```
