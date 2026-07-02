@echo off
setlocal

set "LAUNCHER=%~dp0launcher.bat"
set "LAUNCHER_ESC=%LAUNCHER:\=\\%"

set "REG_FILE=%TEMP%\whatsapp-sender-temp.reg"

(
  echo Windows Registry Editor Version 5.00
  echo.
  echo [HKEY_CURRENT_USER\Software\Classes\whatsapp-sender]
  echo @="URL:WhatsApp Sender Protocol"
  echo "URL Protocol"=""
  echo.
  echo [HKEY_CURRENT_USER\Software\Classes\whatsapp-sender\shell]
  echo.
  echo [HKEY_CURRENT_USER\Software\Classes\whatsapp-sender\shell\open]
  echo.
  echo [HKEY_CURRENT_USER\Software\Classes\whatsapp-sender\shell\open\command]
  echo @="\"C:\\Windows\\System32\\cmd.exe\" /c \"%LAUNCHER_ESC%\" \"%%1\""
) > "%REG_FILE%"

regedit /s "%REG_FILE%"

echo Protocolo registrado correctamente.
echo Ruta: %LAUNCHER%
pause
