set startScriptDir=%cd%

python -m venv env
CALL env\Scripts\activate.bat

pip install -e git+https://bitbucket.org/osimis/build-helpers.git@0.3.0#egg=buildHelpers

python buildWindowsOSX.py

CALL deactivate

cd %startScriptDir%