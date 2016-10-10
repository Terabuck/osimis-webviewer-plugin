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

# Create a WebViewerLibrary.a including all viewer dependencies
# and the core source code (without the plugin.cpp)
#
# Usage:
#   (within CMakeLists.txt)
#	  # Set all required variables
#   set(RESOURCES_DIR ${CMAKE_SOURCE_DIR}/Resources)
#   set(ORTHANC_DIR ${CMAKE_SOURCE_DIR}/Orthanc)
#   set(LOCAL_DEPENDENCIES_DIR ${CMAKE_SOURCE_DIR}/Dependencies)
#   set(VIEWER_LIBRARY_DIR ${CMAKE_SOURCE_DIR}/WebViewerLibrary)
#   # Build intermediate WebViewerLibrary
#   include(${VIEWER_LIBRARY_DIR}/WebViewerLibrary.cmake)
#   # target WebViewerLibrary is available

include(${RESOURCES_DIR}/CMake/GetProductVersionFromGitTag.cmake)

# Parameters of the build
set(STANDALONE_BUILD ON CACHE BOOL "Standalone build (all the resources are embedded, necessary for releases)")
set(BENCHMARK OFF CACHE BOOL "Send benchmark informations to stdout")
set(STATIC_BUILD ON CACHE BOOL "Static build of the third-party libraries (necessary for Windows)")
set(ALLOW_DOWNLOADS ON CACHE BOOL "Allow CMake to download packages")

MESSAGE( STATUS "PRODUCT_VERSION_BRANCH:         " ${PRODUCT_VERSION_BRANCH} )
MESSAGE( STATUS "PRODUCT_VERSION_SHORT_STRING:   " ${PRODUCT_VERSION_SHORT_STRING} )
MESSAGE( STATUS "JS_FRONTEND_VERSION:            " ${JS_FRONTEND_VERSION} )

# Advanced parameters to fine-tune linking against system libraries
set(USE_SYSTEM_BOOST ON CACHE BOOL "Use the system version of Boost")
set(USE_SYSTEM_GDCM ON CACHE BOOL "Use the system version of Grassroot DICOM (GDCM)")
set(USE_SYSTEM_JSONCPP ON CACHE BOOL "Use the system version of JsonCpp")
set(USE_SYSTEM_SQLITE ON CACHE BOOL "Use the system version of SQLite")
set(USE_SYSTEM_ORTHANC_SDK ON CACHE BOOL "Use the system version of the Orthanc plugin SDK")

# Use c++11
include(CheckCXXCompilerFlag)
CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11)
CHECK_CXX_COMPILER_FLAG("-std=c++0x" COMPILER_SUPPORTS_CXX0X)
if(COMPILER_SUPPORTS_CXX11)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
elseif(COMPILER_SUPPORTS_CXX0X)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++0x")
else()
  message(STATUS "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support. Please use a different C++ compiler.")
endif()

# Build dependencies
set(ORTHANC_ROOT ${ORTHANC_DIR}) # required by orthanc's cmake
include(CheckIncludeFiles)
include(CheckIncludeFileCXX)
include(CheckLibraryExists)
include(FindPythonInterp)
include(${ORTHANC_DIR}/Resources/CMake/Compiler.cmake)
include(${ORTHANC_DIR}/Resources/CMake/DownloadPackage.cmake) # Required by boost
include(${ORTHANC_DIR}/Resources/CMake/BoostConfiguration.cmake)
include(${ORTHANC_DIR}/Resources/CMake/JsonCppConfiguration.cmake)
include(${ORTHANC_DIR}/Resources/CMake/SQLiteConfiguration.cmake)
include(${RESOURCES_DIR}/CMake/GdcmConfiguration.cmake)

# Remove policy CMP0042 warning on mac (set to default value)
if (${CMAKE_SYSTEM_NAME} STREQUAL "Darwin")
  set(CMAKE_MACOSX_RPATH 1)
endif()

# Add additional warning/error flags to Clang (for mac)
if (${CMAKE_CXX_COMPILER_ID} STREQUAL "Clang")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wno-long-long -Wno-implicit-function-declaration")  
  # --std=c99 makes libcurl not to compile
  # -pedantic gives a lot of warnings on OpenSSL 
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wno-long-long -Wno-variadic-macros")
endif()

# Include GIL boost library - adobe version with numeric extensions
# Help debug boost GIL templates
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_definitions(-DBOOST_GIL_USE_CONCEPT_CHECK=1)
endif()
include_directories(SYSTEM ${LOCAL_DEPENDENCIES_DIR}/boost-1_60_0/)
include_directories(SYSTEM ${LOCAL_DEPENDENCIES_DIR}/gil-2_1_1/)

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


include_directories(${ORTHANC_DIR})
# Check that the Orthanc SDK headers are available or download them
if (STATIC_BUILD OR NOT USE_SYSTEM_ORTHANC_SDK)
  include_directories(${ORTHANC_DIR}/Sdk-1.1.0)
else ()
  CHECK_INCLUDE_FILE_CXX(orthanc/OrthancCPlugin.h HAVE_ORTHANC_H)
  if (NOT HAVE_ORTHANC_H)
    message(FATAL_ERROR "Please install the headers of the Orthanc plugins SDK")
  endif()
endif()

add_definitions(
  -DORTHANC_SQLITE_STANDALONE=1
  )


if (${CMAKE_SYSTEM_NAME} STREQUAL "Linux" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "kFreeBSD" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "FreeBSD")
  link_libraries(rt)
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

include_directories(${VIEWER_LIBRARY_DIR}/)

# Generate embedded resources
# @todo Move out of the library (and put in WebViewerPlugin.cmake),
#       this may requires to refactor the cpp a bit for no true
#       benefits apart lower executable size
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

# Always embed at least ORTHANC_EXPLORER, even if STANDALONE_BUILD is off?
EmbedResources(
  ORTHANC_EXPLORER  ${RESOURCES_DIR}/OrthancExplorer.js
  ${EMBEDDED_RESOURCES}
  )

# create an intermediary WebViewerLibrary to avoid source recompilation
# for both unit tests and web viewer library
add_library(WebViewerLibrary
  STATIC

  ${BOOST_SOURCES}
  ${SQLITE_SOURCES}
  ${JSONCPP_SOURCES}

  # Sources inherited from Orthanc core
  ${ORTHANC_DIR}/Core/ChunkedBuffer.cpp
  ${ORTHANC_DIR}/Core/Enumerations.cpp
  ${ORTHANC_DIR}/Core/FileStorage/FilesystemStorage.cpp
  ${ORTHANC_DIR}/Core/Images/ImageAccessor.cpp
  ${ORTHANC_DIR}/Core/Images/ImageBuffer.cpp
  ${ORTHANC_DIR}/Core/Images/ImageProcessing.cpp
  ${ORTHANC_DIR}/Core/MultiThreading/SharedMessageQueue.cpp
  ${ORTHANC_DIR}/Core/SQLite/Connection.cpp
  ${ORTHANC_DIR}/Core/SQLite/FunctionContext.cpp
  ${ORTHANC_DIR}/Core/SQLite/Statement.cpp
  ${ORTHANC_DIR}/Core/SQLite/StatementId.cpp
  ${ORTHANC_DIR}/Core/SQLite/StatementReference.cpp
  ${ORTHANC_DIR}/Core/SQLite/Transaction.cpp
  ${ORTHANC_DIR}/Core/Toolbox.cpp
  ${ORTHANC_DIR}/Core/Uuid.cpp
  ${ORTHANC_DIR}/Core/DicomFormat/DicomMap.cpp
  ${ORTHANC_DIR}/Core/DicomFormat/DicomTag.cpp
  ${ORTHANC_DIR}/Core/DicomFormat/DicomValue.cpp
  ${ORTHANC_DIR}/Core/DicomFormat/DicomArray.cpp
  ${ORTHANC_DIR}/Resources/ThirdParty/base64/base64.cpp

  # FrontEnd code
  ${AUTOGENERATED_SOURCES}

  # The following files depend on GDCM
  ${VIEWER_LIBRARY_DIR}/DecodedImageAdapter.cpp
  ${ORTHANC_DIR}/Plugins/Samples/GdcmDecoder/GdcmImageDecoder.cpp
  ${ORTHANC_DIR}/Plugins/Samples/GdcmDecoder/GdcmDecoderCache.cpp
  ${ORTHANC_DIR}/Plugins/Samples/GdcmDecoder/OrthancImageWrapper.cpp
  
  ${VIEWER_LIBRARY_DIR}/OrthancContextManager.cpp
  ${VIEWER_LIBRARY_DIR}/BaseController.cpp
  ${VIEWER_LIBRARY_DIR}/Instance/DicomRepository.cpp
  ${VIEWER_LIBRARY_DIR}/Series/SeriesFactory.cpp
  ${VIEWER_LIBRARY_DIR}/Series/SeriesRepository.cpp
  ${VIEWER_LIBRARY_DIR}/Series/Series.cpp
  ${VIEWER_LIBRARY_DIR}/Series/SeriesController.cpp
  ${VIEWER_LIBRARY_DIR}/Image/AvailableQuality/OnTheFlyDownloadAvailableQualityPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/Utilities/KLVWriter.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageContainer/RawImageContainer.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageContainer/CompressedImageContainer.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageContainer/CornerstoneKLVContainer.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/CompositePolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/PixelDataQualityPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/HighQualityPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/MediumQualityPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/LowQualityPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/ResizePolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/Uint8ConversionPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/JpegConversionPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/PngConversionPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageProcessingPolicy/KLVEmbeddingPolicy.cpp
  ${VIEWER_LIBRARY_DIR}/Image/Image.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageMetaData.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageRepository.cpp
  ${VIEWER_LIBRARY_DIR}/Image/ImageController.cpp
  
  ${VIEWER_LIBRARY_DIR}/BenchmarkHelper.cpp
  ${VIEWER_LIBRARY_DIR}/ViewerToolbox.cpp
  ${VIEWER_LIBRARY_DIR}/WebViewerConfiguration.cpp
  ${VIEWER_LIBRARY_DIR}/WebViewer.cpp
  )
# bind WebViewerLibrary to GDCM so any executable/library embedding 
# WebViewerLibrary.a also embed GDCM.
if (STATIC_BUILD OR NOT USE_SYSTEM_GDCM)
  add_dependencies(WebViewerLibrary GDCM)
endif()
target_link_libraries(WebViewerLibrary ${GDCM_LIBRARIES})

# Check & rebuild if embedded resources has changed?
if (STATIC_BUILD)
  add_dependencies(WebViewerLibrary EmbeddedResourcesGenerator)
endif()

# If using gcc, build WebViewerLibrary with the "-fPIC" argument to allow its
# embedding into the shared library containing the Orthanc plugin
if (${CMAKE_SYSTEM_NAME} STREQUAL "Linux" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "FreeBSD" OR
    ${CMAKE_SYSTEM_NAME} STREQUAL "kFreeBSD")
  get_target_property(Flags WebViewerLibrary COMPILE_FLAGS)
  if(Flags STREQUAL "Flags-NOTFOUND")
    SET(Flags "-fPIC -ldl")
  else()
    SET(Flags "${Flags} -fPIC")
  endif()
  set_target_properties(WebViewerLibrary PROPERTIES
      COMPILE_FLAGS ${Flags})
  target_link_libraries(WebViewerLibrary -ldl)
endif()
