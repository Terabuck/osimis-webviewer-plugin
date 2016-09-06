set startScriptDir=%cd%

python -m venv env
CALL env\Scripts\activate.bat

pip install -e git+https://bitbucket.org/osimis/build-helpers.git@0.3.0#egg=buildHelpers



rem cd ..\backend
rem set backendFolder=%cd%

rem rm -rf build64/
rem mkdir build64
rem cd build64

rem python %startScriptDir%\buildHelpers.py --cmakeFolder=%backendFolder% --buildFolder=%cd% --target=OsimisWebViewer
rem if %errorlevel% neq 0 exit /b %errorlevel%

rem # run the unit tests
rem cd Release
rem UnitTests.exe

rem if %errorlevel% neq 0 exit /b %errorlevel%


rem echo "==========================="
rem echo "Building the 32bits version"
rem echo "==========================="

rem cd %startScriptDir%
rem cd ..\backend

rem rm -rf build32/
rem mkdir build32
rem cd build32

rem python %startScriptDir%\buildHelpers.py --cmakeFolder=%backendFolder% --buildFolder=%cd% --target=OsimisWebViewer
rem if %errorlevel% neq 0 exit /b %errorlevel%

rem # Build the plugin
rem cmake .. -G "Visual Studio 14 2015"
rem "C:\Program Files (x86)\MSBuild\14.0\Bin\MSBuild.exe" OsimisWebViewer.sln /t:Build /maxcpucount /p:Configuration=Release

deactivate

cd %startScriptDir%