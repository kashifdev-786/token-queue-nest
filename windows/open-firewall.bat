@echo off
setlocal EnableExtensions

echo.
echo === Open Windows Firewall for port 4789 ===
echo This script must be run as Administrator.
echo Right-click this file and choose "Run as administrator".
echo.

net session >nul 2>&1
if errorlevel 1 (
  echo ERROR: Not running as Administrator.
  echo Right-click open-firewall.bat ^> Run as administrator
  pause
  exit /b 1
)

netsh advfirewall firewall delete rule name="Zahid Clinic Token Queue" >nul 2>&1
netsh advfirewall firewall add rule name="Zahid Clinic Token Queue" dir=in action=allow protocol=TCP localport=4789

if errorlevel 1 (
  echo ERROR: Could not add firewall rule.
  pause
  exit /b 1
)

echo SUCCESS: Inbound TCP port 4789 is allowed.
echo.
pause
