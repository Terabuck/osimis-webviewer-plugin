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

cmake_minimum_required(VERSION 2.8) # 2.8 is our current windows' CI version of cmake

project(OsimisWebViewer)

# Set paths
set(RESOURCES_DIR ${CMAKE_SOURCE_DIR}/Resources)
set(ORTHANC_DIR ${CMAKE_SOURCE_DIR}/Orthanc)
set(LOCAL_DEPENDENCIES_DIR ${CMAKE_SOURCE_DIR}/Dependencies)
set(VIEWER_LIBRARY_DIR ${CMAKE_SOURCE_DIR}/WebViewerLibrary)
set(VIEWER_PLUGIN_DIR ${CMAKE_SOURCE_DIR}/WebViewerPlugin)
set(VIEWER_TESTS_DIR ${CMAKE_SOURCE_DIR}/WebViewerTests)
set(VIEWER_FRONTEND_DIR ${CMAKE_SOURCE_DIR}/../frontend)

# Build intermediate Web Viewer Library
include(${VIEWER_LIBRARY_DIR}/WebViewerLibrary.cmake)

# Build OsimisWebViewer Orthanc Plugin
include(${VIEWER_PLUGIN_DIR}/WebViewerPlugin.cmake)

# Build OsimisWebViewer's unit tests
include(${VIEWER_TESTS_DIR}/WebViewerTests.cmake)
