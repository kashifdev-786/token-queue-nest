@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

set "APP_DIR=%CD%"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LAUNCHER=%STARTUP%\ZahidClinicTokenQueue.cmd"

if not exist "server.js" (
  echo ERROR: server.js not found. Run install-and-build.bat first.
  pause
  exit /b 1
)

if not exist "logs" mkdir logs

(
echo @echo off
echo cd /d "%APP_DIR%"
echo call "%APP_DIR%\windows\start-server-background.bat"
) > "%LAUNCHER%"

echo.
echo SUCCESS: Auto-start configured.
echo Created: %LAUNCHER%
echo The server starts when this Windows user logs in.
echo.
echo To remove auto-start, run remove-autostart.bat
echo.
pause
