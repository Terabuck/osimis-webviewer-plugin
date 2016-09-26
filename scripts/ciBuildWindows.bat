set startScriptDir=%cd%

set action=%1
set branchName=%2

python -m venv env
call "env\Scripts\activate.bat"

pip install -r requirements.txt
if %errorlevel% neq 0 exit /b %errorlevel%

python buildWindowsOsx.py %action% %branchName%
if %errorlevel% neq 0 exit /b %errorlevel%

deactivate

cd %startScriptDir%
