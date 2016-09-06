if(NOT GIT_FOUND)
    find_package(Git QUIET)
endif()

# get git version info from git tags
execute_process(COMMAND
    "${GIT_EXECUTABLE}"
    describe --tags --long --dirty=-dirty
    WORKING_DIRECTORY
    "${CMAKE_SOURCE_DIR}"
    RESULT_VARIABLE
    res
    OUTPUT_VARIABLE
    gitRepoVersion
    ERROR_QUIET
    OUTPUT_STRIP_TRAILING_WHITESPACE)
if(NOT res EQUAL 0)
    message(FATAL_ERROR "could not describe git tag.  Make sure you have already tagged your repo with a command like 'git tag -a \"0.1.0\".  ' ${gitRepoVersion}-${res}")
endif()

# get git branch
execute_process(COMMAND
  "${GIT_EXECUTABLE}"
  rev-parse --abbrev-ref HEAD
  WORKING_DIRECTORY
  "${CMAKE_SOURCE_DIR}"
  OUTPUT_VARIABLE
  PRODUCT_VERSION_BRANCH
  OUTPUT_STRIP_TRAILING_WHITESPACE
)

message("CMAKE_SOURCE_DIR = ${CMAKE_SOURCE_DIR}")
message("Git version = ${gitRepoVersion}")

#parse the version information into pieces.
string(REGEX REPLACE "^([0-9]+)\\..*" "\\1" PRODUCT_VERSION_MAJOR "${gitRepoVersion}")
string(REGEX REPLACE "^[0-9]+\\.([0-9]+).*" "\\1" PRODUCT_VERSION_MINOR "${gitRepoVersion}")
string(REGEX REPLACE "^[0-9]+\\.[0-9]+\\.([0-9]+).*" "\\1" PRODUCT_VERSION_PATCH "${gitRepoVersion}")
string(REGEX REPLACE "^[0-9]+\\.[0-9]+\\.[0-9]+-([0-9]+)-.*" "\\1" PRODUCT_VERSION_COMMIT_NUMBER "${gitRepoVersion}")
string(REGEX REPLACE "^[0-9]+\\.[0-9]+\\.[0-9]+-[0-9]+-g(.*)" "\\1" PRODUCT_VERSION_COMMIT_SHA1_STRING "${gitRepoVersion}")
string(TIMESTAMP PRODUCT_VERSION_BUILD_YEAR %Y)
string(TIMESTAMP PRODUCT_VERSION_BUILD_MONTH %m)
string(TIMESTAMP PRODUCT_VERSION_BUILD_DAY %d)
set(PRODUCT_VERSION_SHORT_STRING "${PRODUCT_VERSION_MAJOR}.${PRODUCT_VERSION_MINOR}.${PRODUCT_VERSION_PATCH}")  #used by cmake directly to set .so/.dylib version numbers
message(${PRODUCT_VERSION_MAJOR})
message(${PRODUCT_VERSION_MINOR})
message(${PRODUCT_VERSION_PATCH})
message(${PRODUCT_VERSION_COMMIT_NUMBER})
message(${PRODUCT_VERSION_COMMIT_SHA1_STRING})
message(${PRODUCT_VERSION_SHORT_STRING})

#define macros that can be reused inside the C++ code (i.e, in the resources.rc file when building a windows DLL)
add_definitions(-DPRODUCT_VERSION_BRANCH=${PRODUCT_VERSION_BRANCH})
add_definitions(-DPRODUCT_VERSION_MAJOR=${PRODUCT_VERSION_MAJOR})
add_definitions(-DPRODUCT_VERSION_MINOR=${PRODUCT_VERSION_MINOR})
add_definitions(-DPRODUCT_VERSION_PATCH=${PRODUCT_VERSION_PATCH})
add_definitions(-DPRODUCT_VERSION_COMMIT_NUMBER=${PRODUCT_VERSION_COMMIT_NUMBER})
add_definitions(-DPRODUCT_VERSION_COMMIT_SHA1_STRING=\"${PRODUCT_VERSION_COMMIT_SHA1_STRING}\")
add_definitions(-DPRODUCT_VERSION_BUILD_YEAR_STRING=\"${PRODUCT_VERSION_BUILD_YEAR}\")
add_definitions(-DPRODUCT_VERSION_BUILD_MONTH_STRING=\"${PRODUCT_VERSION_BUILD_MONTH}\")
add_definitions(-DPRODUCT_VERSION_BUILD_DAY_STRING=\"${PRODUCT_VERSION_BUILD_DAY}\")
