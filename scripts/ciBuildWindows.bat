set startScriptDir=%cd%

set action=%1
set branchName=%2

python -m venv env
CALL env\Scripts\activate.bat

pip install -r requirements.txt
if %errorlevel% neq 0 exit /b %errorlevel%

python buildWindowsOsx.py %action% %branchName%
if %errorlevel% neq 0 exit /b %errorlevel%

CALL deactivate

cd %startScriptDir%
