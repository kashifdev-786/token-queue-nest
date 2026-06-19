@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo.
echo === Environment check ===
echo Project folder: %CD%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Node.js not found in PATH
) else (
  echo [OK] Node:
  node -v
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [FAIL] npm not found in PATH
) else (
  echo [OK] npm:
  call npm -v
)

if exist "server.js" (
  echo [OK] server.js exists
) else (
  echo [FAIL] server.js missing - run install-and-build.bat
)

echo.
echo LAN IP addresses:
ipconfig | findstr /i "IPv4"
echo.
pause
