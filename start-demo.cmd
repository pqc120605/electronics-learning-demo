@echo off
setlocal
cd /d "%~dp0"
echo Starting Mach Mo from %CD%
echo Opening http://127.0.0.1:5173/build
echo Keep this window open while using the demo.
call npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort --open /build
if errorlevel 1 (
  echo.
  echo Could not start Mach Mo on port 5173.
  echo If the port is already in use, close the other Mach Mo terminal and try again.
  echo Check that Node.js dependencies are installed with: npm.cmd install
)
pause
