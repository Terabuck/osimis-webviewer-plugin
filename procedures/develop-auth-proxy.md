                         Develop Authentification Proxy
-------------------------------------------------------------------------------

Most of the viewer's user require an authentification method at some point.
Developing a reverse-proxy is the most versatile way to achieve that goal.
This file references each HTTP routes used. When the web viewer is embedded 
within an iframe, parsing the routes allows to block and allow requests upon
user credentials retrieved from cookies.

To keep good performances, the proxy overhead should be kept small. On large
systems, this can be achieved using eventual consistency: proxy's internal
requests can be cached for a small amount of time (at least a few minutes).
Most programming language comes with a memcached module. This fit well for
this concerns. A Redis database may also be used.

The plugin uses severals GET HTTP routes. These routes are considered unstable
and may change often (see `procedures/release-version.md` for more details).
The current file should be looked upon for any update. Release notes also 
include breaking changes.

----

```
/osimis-viewer/images/<instance_uid:str>/<frame_index:int>/{low|medium|high|pixeldata}-quality
```

This route retrieve an image binary (embedded in KLV format, see source code
for detailed format informations - use 0 for monoframe instances).

----

```
/osimis-viewer/series/<series_uid:str>
```

This route provides informations about a series.

----

```
/osimis-viewer/config.js
```

Called as `../config.js` relative path from `/osimis-viewer/app/`.
This route provides configuration for frontend.

----

```
/osimis-viewer/app/*
```

This rouet serves the frontend.

----

The following Orthanc routes are also used:

```
/studies/
/studies/<uid>
/instances/<uid>/simplified-tags
/instances/<uid>/pdf
/series/<uid>/study
/plugins/osimis-web-viewer
/system
```
