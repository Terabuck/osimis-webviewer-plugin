# Orthanc - A Lightweight, RESTful DICOM Store
# Copyright (C) 2012-2016 Sebastien Jodogne, Medical Physics
# Department, University Hospital of Liege, Belgium
# Copyright (C) 2016 OSIMIS SA
#
# This program is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public License
# as published by the Free Software Foundation, either version 3 of
# the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

# Build the plugin as a shared library.
#
# Usage:
#   (within CMakeLists.txt)
#   # Set all required variables
#   set(ORTHANC_DIR ${CMAKE_SOURCE_DIR}/Orthanc)
#   set(VIEWER_PLUGIN_DIR ${CMAKE_SOURCE_DIR}/WebViewerPlugin)
#   set(VIEWER_FRONTEND_DIR ${CMAKE_SOURCE_DIR}/../frontend)
#   # Make sure WebViewerLibrary target is available (see `WebViewerLibrary/WebViewerLibrary.cmake`)
#   # Build unit tests
#   include(${WebViewerPlugin}/WebViewerPlugin.cmake)

# Set build parameters
set(STANDALONE_BUILD ON CACHE BOOL "Standalone build (all the resources are embedded, necessary for releases)")
set(JS_CLIENT_PATH "${VIEWER_FRONTEND_DIR}/build" CACHE STRING "Path of the front-end build folder")
if(EXISTS ${JS_CLIENT_PATH}) # If file exists (not var)
  # Set frontend version based on local build if available
  # when building inside the docker container, the frontend/build folder is already there and we don't want to override it.
  set(JS_FRONTEND_VERSION "LOCAL")
else()
  # Set frontend version based on the commit id for all other builds including the release version
  set(JS_FRONTEND_VERSION ${PRODUCT_VERSION_COMMIT_SHA1_STRING})
endif()

# Download the frontend lib
set(ORTHANC_ROOT ${ORTHANC_DIR}) # required by orthanc's cmake files (eg. AutoGeneratedCode.cmake)
include(${ORTHANC_DIR}/Resources/CMake/DownloadPackage.cmake)
if(NOT ${JS_FRONTEND_VERSION} STREQUAL "LOCAL") 
  DownloadPackage(FALSE "http://orthanc.osimis.io/public/osimisWebViewer/${JS_FRONTEND_VERSION}.zip" ${JS_CLIENT_PATH} TRUE)
endif()

# Generate embedded resources
include(${ORTHANC_DIR}/Resources/CMake/AutoGeneratedCode.cmake)
if (STANDALONE_BUILD)
  add_definitions(
    -DORTHANC_STANDALONE=1
    )
  set(EMBEDDED_RESOURCES
    WEB_VIEWER  ${JS_CLIENT_PATH}
    )
else()
  add_definitions(
    -DORTHANC_STANDALONE=0
    -DWEB_VIEWER_PATH="${JS_CLIENT_PATH}/"
    )
endif()

EmbedResources(
  ORTHANC_EXPLORER  ${RESOURCES_DIR}/OrthancExplorer.js
  ${EMBEDDED_RESOURCES}
  )

# Create OsimisWebViewer Plugin as a dynamic library
add_library(OsimisWebViewer
  SHARED
  ${AUTOGENERATED_SOURCES}
  $<$<STREQUAL:${CMAKE_SYSTEM_NAME},"Windows">:${VIEWER_PLUGIN_DIR}/resources.rc>
  ${VIEWER_PLUGIN_DIR}/Plugin.cpp
  )

if (STATIC_BUILD)
  add_dependencies(OsimisWebViewer EmbeddedResourcesGenerator)
endif()

add_dependencies(OsimisWebViewer WebViewerLibrary)
target_link_libraries(OsimisWebViewer WebViewerLibrary)

message("Setting the version of the library to ${PRODUCT_VERSION_SHORT_STRING}")

set_target_properties(OsimisWebViewer PROPERTIES
    VERSION ${PRODUCT_VERSION_SHORT_STRING}
    SOVERSION ${PRODUCT_VERSION_SHORT_STRING})

install(
  TARGETS OsimisWebViewer
  RUNTIME DESTINATION lib                      # Destination for Windows
  LIBRARY DESTINATION share/orthanc/plugins    # Destination for Linux
  )