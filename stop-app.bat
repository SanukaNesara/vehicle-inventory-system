@echo off
echo Stopping AutoParts Pro...
taskkill /f /im electron.exe 2>nul
taskkill /f /im node.exe 2>nul
echo Application stopped.
pause