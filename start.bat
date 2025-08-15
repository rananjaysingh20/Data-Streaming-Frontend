@echo off
echo Starting MT5 Tick Stream Frontend...
echo.
echo Choose how to run the frontend:
echo 1. HTTP Server (Recommended - avoids CORS issues)
echo 2. Direct file opening (may have CORS issues)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting HTTP server...
    python serve.py
) else (
    echo.
    echo Opening frontend directly in browser...
    start index.html
    echo.
    echo Frontend opened! Make sure your backend is running on http://127.0.0.1:8000
    echo If you see CORS errors, use option 1 instead.
    pause
)
