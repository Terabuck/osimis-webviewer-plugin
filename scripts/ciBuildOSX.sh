#!/bin/bash
# prerequisites: sudo apt-get install -y python3-venv
set -x #to debug the script

scriptName=`basename $0`
startScriptDir=$(pwd)
echo "executing script $scriptName"
export PATH=$PATH:/usr/local/bin
#export PATH=$PATH:/Library/Frameworks/Python.framework/Versions/3.5/bin
echo "path=$PATH"
who=$(whoami)
echo "running script as $who"

cd ..
rootDir=$(pwd)
#create a python virtual environment
pyvenv env

source env/bin/activate
#pip install -r requirements.txt
pip install awscli
export PATH=$PATH:/usr/local/bin

#at the Labs, download of 3rd parties from Montefiore website sometimes fails => download them from s3
mkdir -p ThirdPartyDownloads
aws s3 sync s3://thirdpartydownloads/ ThirdPartyDownloads

cd $rootDir
rm -rf build/
mkdir -p build
cd build
buildDir=$(pwd)
cmake .. -DALLOW_DOWNLOADS:BOOL=ON -DSTANDALONE_BUILD:BOOL=ON -DSTATIC_BUILD:BOOL=ON -DCMAKE_BUILD_TYPE:STRING=Release

make -j2

./UnitTests

#update web app files
#cd $rootDir/src/web/private
#npm install
#grunt default --force

#copy web app files to build folder
#mkdir -p $buildDir/web/static
#cp -r $rootDir/src/web/static/ $buildDir/web/static/

#todo: change version number

#copy artifacts to S3
aws s3 cp libOrthancWebViewer.dylib s3://devreleases/osx/

#get back to startup dir and exit virtual env
cd $startScriptDir
deactivate
echo "**** execution of script $scriptName complete: $ret ****"
exit $ret


