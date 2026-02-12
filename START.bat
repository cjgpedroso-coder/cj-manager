@echo off
title CJ Sistema - Servidor
color 0A
echo.
echo  ============================================
echo    CJ Sistema Interno - Iniciando servidor
echo  ============================================
echo.

REM Ensure data directory exists for SQLite
if not exist "%~dp0data" mkdir "%~dp0data"

REM Start backend (Express + SQLite) in background
echo  Iniciando backend (SQLite)...
start "CJ Backend" /MIN cmd /c "cd /d \"%~dp0\" && node server.js"

REM Wait for backend to start
timeout /t 2 /nobreak >nul

REM Open browser
echo  Abrindo navegador em http://localhost:5173...
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173

REM Start frontend (Vite dev server)
cd /d "%~dp0"
npm run dev
pause
