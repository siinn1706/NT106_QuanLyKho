@echo off
echo ================================
echo   Starting Client 1 (Port 5173)
echo ================================
echo.

cd /d "%~dp0\UI_Desktop"

echo Installing/Updating dependencies...
call npm install
echo.

echo Starting Client 1 on port 5173...
echo Open browser: http://localhost:5173
echo.
npm run dev -- --port 5173 --host

pause
