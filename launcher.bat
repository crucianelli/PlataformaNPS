@echo off
pushd "%~dp0"
python mensajes.py %1 >> log.txt 2>&1
if %errorlevel% neq 0 (
    echo ERROR - ver log.txt para detalles
    type log.txt
)
popd
pause
