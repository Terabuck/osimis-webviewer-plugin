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


# Create a OsimisWebViewerObject.a including all viewer dependencies
# and the core source code (without the plugin.cpp)
#
# Usage:
#   (within CMakeLists.txt)
#	set(...) # set all required variables
#   include(WebViewerLibrary.cmake)
#   # target OsimisWebViewerObject is available

cmake_minimum_required(VERSION 2.8)

project(OsimisWebViewer)

## Set variables

include(${CMAKE_SOURCE_DIR}/Resources/CMake/GetProductVersionFromGitTag.cmake)

# Parameters of the build
set(BENCHMARK OFF CACHE BOOL "Send benchmark informations to stdout")
set(STATIC_BUILD ON CACHE BOOL "Static build of the third-party libraries (necessary for Windows)")
SET(STANDALONE_BUILD ON CACHE BOOL "Standalone build (all the resources are embedded, necessary for releases)")
set(ALLOW_DOWNLOADS ON CACHE BOOL "Allow CMake to download packages")
set(JS_CLIENT_PATH "${CMAKE_SOURCE_DIR}/../frontend/build" CACHE STRING "Path of the front-end build folder")

if(EXISTS ${JS_CLIENT_PATH}) # If file exists (not var)
  # Set frontend version based on local build if available
  # when building inside the docker container, the frontend/build folder is already there and we don't want to override it.
  set(JS_FRONTEND_VERSION "LOCAL")
else()
  # Set frontend version based on the commit id for all other builds including the release version
  set(JS_FRONTEND_VERSION ${PRODUCT_VERSION_COMMIT_SHA1_STRING})
endif()

MESSAGE( STATUS "PRODUCT_VERSION_BRANCH:         " ${PRODUCT_VERSION_BRANCH} )
MESSAGE( STATUS "PRODUCT_VERSION_SHORT_STRING:   " ${PRODUCT_VERSION_SHORT_STRING} )
MESSAGE( STATUS "JS_FRONTEND_VERSION:            " ${JS_FRONTEND_VERSION} )

# Directory CMAKE_USE_RELATIVE_PATHS
set(VIEWER_PLUGIN_SOURCE_DIR ${CMAKE_SOURCE_DIR}/WebViewerPlugin)
set(VIEWER_LIBRARY_SOURCE_DIR ${CMAKE_SOURCE_DIR}/WebViewerLibrary)

# Advanced parameters to fine-tune linking against system libraries
set(USE_SYSTEM_BOOST ON CACHE BOOL "Use the system version of Boost")
set(USE_SYSTEM_GDCM ON CACHE BOOL "Use the system version of Grassroot DICOM (GDCM)")
set(USE_SYSTEM_GOOGLE_TEST ON CACHE BOOL "Use the system version of Google Test")
set(USE_SYSTEM_JSONCPP ON CACHE BOOL "Use the system version of JsonCpp")
set(USE_SYSTEM_SQLITE ON CACHE BOOL "Use the system version of SQLite")
set(USE_SYSTEM_ORTHANC_SDK ON CACHE BOOL "Use the system version of the Orthanc plugin SDK")

# Distribution-specific settings
set(USE_GTEST_DEBIAN_SOURCE_PACKAGE OFF CACHE BOOL "Use the sources of Google Test shipped with libgtest-dev (Debian only)")
mark_as_advanced(USE_GTEST_DEBIAN_SOURCE_PACKAGE)

# Build dependencies
set(ORTHANC_ROOT ${CMAKE_SOURCE_DIR}/Orthanc) # needed by AutoGeneratedCode.cmake
include(CheckIncludeFiles)
include(CheckIncludeFileCXX)
include(CheckLibraryExists)
include(FindPythonInterp)
include(${ORTHANC_ROOT}/Resources/CMake/Compiler.cmake)
include(${ORTHANC_ROOT}/Resources/CMake/AutoGeneratedCode.cmake)
include(${ORTHANC_ROOT}/Resources/CMake/DownloadPackage.cmake)

#download the frontend lib
if(NOT ${JS_FRONTEND_VERSION} STREQUAL "LOCAL") 
  DownloadPackage(FALSE "http://orthanc.osimis.io/public/osimisWebViewer/${JS_FRONTEND_VERSION}.zip" ${JS_CLIENT_PATH} TRUE)
endif()

include(${ORTHANC_ROOT}/Resources/CMake/BoostConfiguration.cmake)
include(${ORTHANC_ROOT}/Resources/CMake/GoogleTestConfiguration.cmake)
include(${ORTHANC_ROOT}/Resources/CMake/JsonCppConfiguration.cmake)
include(${ORTHANC_ROOT}/Resources/CMake/SQLiteConfiguration.cmake)

include(${CMAKE_SOURCE_DIR}/Resources/CMake/GdcmConfiguration.cmake)

# Include GIL boost library - adobe version with numeric extensions
# Help debug boost GIL templates
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_definitions(-DBOOST_GIL_USE_CONCEPT_CHECK=1)
endif()
include_directories(${CMAKE_SOURCE_DIR}/Dependencies/boost-1_60_0/)
include_directories(${CMAKE_SOURCE_DIR}/Dependencies/gil-2_1_1/)

# Enable image processing *generic* http routes on debug mode
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_definitions(-DPLUGIN_ENABLE_DEBUG_ROUTE=1)
endif()

if (BENCHMARK)
  add_definitions(
    -DBENCHMARK=1
    )
  add_definitions(
      -DBOOST_CHRONO_HEADER_ONLY
      #-DBOOST_ERROR_CODE_HEADER_ONLY
    )

  # Fix boost chrono to work on mac X.11
  if (${CMAKE_SYSTEM_NAME} STREQUAL "Darwin")
    add_definitions(
      -D_DARWIN_C_SOURCE
    )
  endif()
endif()


include_directories(${ORTHANC_ROOT})
# Check that the Orthanc SDK headers are available or download them
if (STATIC_BUILD OR NOT USE_SYSTEM_ORTHANC_SDK)
  include_directories(${ORTHANC_ROOT}/Sdk-1.1.0)
else ()
  CHECK_INCLUDE_FILE_CXX(orthanc/OrthancCPlugin.h HAVE_ORTHANC_H)
  if (NOT HAVE_ORTHANC_H)
    message(FATAL_ERROR "Please install the headers of the Orthanc plugins SDK")
  endif()
endif()


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
  ORTHANC_EXPLORER  ${CMAKE_SOURCE_DIR}/Resources/OrthancExplorer.js
  ${EMBEDDED_RESOURCES}
  )

add_definitions(
  -DORTHANC_SQLITE_STANDALONE=1
  )


if (${CMAKE_SYSTEM_NAME} STREQUAL "Linux" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "kFreeBSD" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "FreeBSD")
  link_libraries(rt)
elseif (${CMAKE_SYSTEM_NAME} STREQUAL "Windows")
   list(APPEND PLUGIN_SOURCES  ${PLUGIN_SOURCES}/resources.rc)
endif()

if (APPLE)
  SET(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -framework CoreFoundation")
  SET(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -framework CoreFoundation")
endif()

add_definitions(
  -DORTHANC_ENABLE_MD5=0
  -DORTHANC_ENABLE_BASE64=0
  -DORTHANC_ENABLE_LOGGING=0
  )

include_directories(${VIEWER_LIBRARY_SOURCE_DIR}/)
# @todo remove
include_directories(${VIEWER_LIBRARY_SOURCE_DIR}/Image)
include_directories(${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageContainer)
include_directories(${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy)
include_directories(${VIEWER_LIBRARY_SOURCE_DIR}/Image/Utilities)

# create an intermediary OsimisWebViewerObject to avoid source recompilation
# for both unit tests and web viewer library
add_library(OsimisWebViewerObject
  STATIC

  ${BOOST_SOURCES}
  ${SQLITE_SOURCES}
  ${JSONCPP_SOURCES}

  # Sources inherited from Orthanc core
  ${ORTHANC_ROOT}/Core/ChunkedBuffer.cpp
  ${ORTHANC_ROOT}/Core/Enumerations.cpp
  ${ORTHANC_ROOT}/Core/FileStorage/FilesystemStorage.cpp
  ${ORTHANC_ROOT}/Core/Images/ImageAccessor.cpp
  ${ORTHANC_ROOT}/Core/Images/ImageBuffer.cpp
  ${ORTHANC_ROOT}/Core/Images/ImageProcessing.cpp
  ${ORTHANC_ROOT}/Core/MultiThreading/SharedMessageQueue.cpp
  ${ORTHANC_ROOT}/Core/SQLite/Connection.cpp
  ${ORTHANC_ROOT}/Core/SQLite/FunctionContext.cpp
  ${ORTHANC_ROOT}/Core/SQLite/Statement.cpp
  ${ORTHANC_ROOT}/Core/SQLite/StatementId.cpp
  ${ORTHANC_ROOT}/Core/SQLite/StatementReference.cpp
  ${ORTHANC_ROOT}/Core/SQLite/Transaction.cpp
  ${ORTHANC_ROOT}/Core/Toolbox.cpp
  ${ORTHANC_ROOT}/Core/Uuid.cpp
  ${ORTHANC_ROOT}/Core/DicomFormat/DicomMap.cpp
  ${ORTHANC_ROOT}/Core/DicomFormat/DicomTag.cpp
  ${ORTHANC_ROOT}/Core/DicomFormat/DicomValue.cpp
  ${ORTHANC_ROOT}/Core/DicomFormat/DicomArray.cpp
  ${ORTHANC_ROOT}/Resources/ThirdParty/base64/base64.cpp

  # The following files depend on GDCM
  ${VIEWER_LIBRARY_SOURCE_DIR}/DecodedImageAdapter.cpp
  ${ORTHANC_ROOT}/Plugins/Samples/GdcmDecoder/GdcmImageDecoder.cpp
  ${ORTHANC_ROOT}/Plugins/Samples/GdcmDecoder/GdcmDecoderCache.cpp
  ${ORTHANC_ROOT}/Plugins/Samples/GdcmDecoder/OrthancImageWrapper.cpp
  
  ${VIEWER_LIBRARY_SOURCE_DIR}/OrthancContextManager.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/BaseController.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Instance/DicomRepository.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Series/SeriesFactory.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Series/SeriesRepository.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Series/Series.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Series/SeriesController.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/Utilities/KLVWriter.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageContainer/RawImageContainer.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageContainer/CompressedImageContainer.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageContainer/CornerstoneKLVContainer.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/CompositePolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/PixelDataQualityPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/HighQualityPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/MediumQualityPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/LowQualityPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/ResizePolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/Uint8ConversionPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/JpegConversionPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/PngConversionPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageProcessingPolicy/KLVEmbeddingPolicy.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/Image.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageMetaData.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageRepository.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/Image/ImageController.cpp
  
  ${VIEWER_LIBRARY_SOURCE_DIR}/BenchmarkHelper.cpp
  ${VIEWER_LIBRARY_SOURCE_DIR}/ViewerToolbox.cpp
  )
# bind OsimisWebViewerObject to GDCM & EmbeddedResources so any executable/library embedding 
# OsimisWebViewerObject.a also embed both.
if (STATIC_BUILD OR NOT USE_SYSTEM_GDCM)
  add_dependencies(OsimisWebViewerObject GDCM EmbeddedResourcesGenerator)
endif()
target_link_libraries(OsimisWebViewerObject ${GDCM_LIBRARIES})

# If using gcc, build OsimisWebViewerObject with the "-fPIC" argument to allow its
# embedding into the shared library containing the Orthanc plugin
if (${CMAKE_SYSTEM_NAME} STREQUAL "Linux" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "FreeBSD" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "kFreeBSD")
  get_target_property(Flags OsimisWebViewerObject COMPILE_FLAGS)
  if(Flags STREQUAL "Flags-NOTFOUND")
    SET(Flags "-fPIC -ldl")
  else()
    SET(Flags "${Flags} -fPIC")
  endif()
  set_target_properties(OsimisWebViewerObject PROPERTIES
      COMPILE_FLAGS ${Flags})
  target_link_libraries(OsimisWebViewerObject -ldl)
endif()
