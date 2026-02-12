@echo off
title CJ Sistema - Servidor
color 0A
echo.
echo  ============================================
echo    CJ Sistema Interno - Iniciando servidor
echo  ============================================
echo.
echo  Abrindo navegador em http://localhost:5173...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
cd /d "%~dp0"
npm run dev
pause
