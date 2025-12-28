@echo off
echo ================================
echo   Starting Full Application
echo ================================
echo.
echo Starting Backend and Frontend...
echo.

start "Backend (FastAPI)" cmd /k "%~dp0start_backend.bat"

timeout /t 3 /nobreak >nul

start "Frontend (Tauri)" cmd /k "%~dp0start_frontend.bat"

echo.
echo Both servers are starting in separate windows.
echo Close this window or press any key to exit.
pause >nul
