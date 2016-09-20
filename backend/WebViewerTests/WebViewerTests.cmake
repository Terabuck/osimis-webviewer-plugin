# Create a UnitTests executable testing the WebViewerLibrary.
#
# Usage:
#   (within CMakeLists.txt)
#   # Set all required variables
#   set(ORTHANC_DIR ${CMAKE_SOURCE_DIR}/Orthanc)
#   set(VIEWER_TESTS_DIR ${CMAKE_SOURCE_DIR}/WebViewerTests)
#   # Make sure WebViewerLibrary target is available (see `WebViewerLibrary/WebViewerLibrary.cmake`)
#   # Build unit tests
#   include(${WebViewerTests}/WebViewerTests.cmake)

# Distribution-specific settings
set(USE_SYSTEM_GOOGLE_TEST ON CACHE BOOL "Use the system version of Google Test")
set(USE_GTEST_DEBIAN_SOURCE_PACKAGE OFF CACHE BOOL "Use the sources of Google Test shipped with libgtest-dev (Debian only)")
mark_as_advanced(USE_GTEST_DEBIAN_SOURCE_PACKAGE)
include(${ORTHANC_DIR}/Resources/CMake/GoogleTestConfiguration.cmake)

# Create unit test executable
add_executable(UnitTests
  ${GTEST_SOURCES}
  ${VIEWER_TESTS_DIR}/UnitTestsMain.cpp
  )
add_dependencies(UnitTests WebViewerLibrary)
target_link_libraries(UnitTests WebViewerLibrary)
