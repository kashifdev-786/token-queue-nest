@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist "server.js" (
  echo ERROR: server.js not found.
  echo Run install-and-build.bat first.
  pause
  exit /b 1
)

if not exist "logs" mkdir logs

echo.
echo Starting Zahid Clinic Token Queue...
echo Press Ctrl+C to stop.
echo.

node server.js

echo.
echo Server stopped.
pause
