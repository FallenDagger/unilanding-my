@echo off
echo ============================================
echo   UniLanding MY - Local Development Server
echo ============================================
echo.
echo Starting server on http://localhost:8080
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0"
python -m http.server 8080
pause