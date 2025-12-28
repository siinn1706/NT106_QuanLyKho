@echo off
echo ================================
echo   Starting Frontend (Tauri)
echo ================================
echo.

cd /d "%~dp0\UI_Desktop"

echo Installing/Updating dependencies...
call npm install
echo.

echo Starting Tauri development server...
echo.
npm run tauri dev

pause
