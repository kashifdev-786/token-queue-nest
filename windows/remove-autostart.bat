@echo off
setlocal EnableExtensions

set "LAUNCHER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ZahidClinicTokenQueue.cmd"

if exist "%LAUNCHER%" (
  del /f /q "%LAUNCHER%"
  echo Removed auto-start: %LAUNCHER%
) else (
  echo No auto-start entry found.
)

pause
