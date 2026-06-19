@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 exit /b 1
if not exist "server.js" exit /b 1
if not exist "logs" mkdir logs

node server.js >> logs\server.log 2>&1
