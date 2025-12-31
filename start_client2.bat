@echo off
echo ================================
echo   Starting Client 2 (Port 5174)
echo ================================
echo.

cd /d "%~dp0\UI_Desktop"

echo Installing/Updating dependencies...
call npm install
echo.

echo Starting Client 2 on port 5174...
echo Open browser: http://localhost:5174
echo.
npm run dev -- --port 5174 --host

pause
