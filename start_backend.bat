@echo off
echo ================================
echo   Starting Backend (FastAPI)
echo ================================
echo.

cd /d "%~dp0\KhoHang_API"

if not exist .venv (
    echo Virtual environment not found. Creating...
    python -m venv .venv
    echo.
)

echo Activating virtual environment...
call .venv\Scripts\activate

echo Installing/Updating dependencies...
pip install -r requirements.txt
echo.

echo Starting FastAPI server...
echo Server will run at: http://localhost:8000
echo Docs available at: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload

pause
