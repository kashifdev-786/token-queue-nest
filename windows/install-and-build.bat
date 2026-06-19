@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo.
echo === Zahid Clinic Token Queue - Install ===
echo Project folder: %CD%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Use Node.js 12 LTS or 13.x on Windows 7.
  echo See WINDOWS-7-DEPLOYMENT.md
  pause
  exit /b 1
)

echo Node version:
node -v
echo npm version:
call npm -v
echo.

echo Running npm install...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)

if not exist "server.js" (
  echo ERROR: server.js not found.
  pause
  exit /b 1
)

echo.
echo SUCCESS: Ready to run.
echo Next: double-click start-server.bat
echo.
pause
