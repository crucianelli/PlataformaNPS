@echo off
pushd "%~dp0"
python mensajes.py %1
popd
pause
