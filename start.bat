@echo off
title Paper2Colab - PDF to Google Colab Tutorial Converter

echo ============================================================
echo  Paper2Colab - PDF to Google Colab Tutorial Converter
echo ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

:: Install / upgrade dependencies
echo [1/2] Installing dependencies...
pip install -r requirements.txt --quiet

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo [2/2] Starting server...
echo.
echo  Open your browser at:  http://localhost:5000
echo  Press Ctrl+C to stop.
echo.
python app.py

pause
