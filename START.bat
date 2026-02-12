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

REM Kill any lingering node processes on port 3001
echo  Encerrando processos anteriores...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

REM Start backend (Express + SQLite) in background
echo  Iniciando backend (SQLite)...
start "CJ Backend" /MIN cmd /c "cd /d "%~dp0" && node server.js"

REM Wait for backend to actually be ready (up to 20 seconds)
echo  Aguardando backend ficar pronto...
set RETRIES=0
:waitloop
timeout /t 1 /nobreak >nul
set /a RETRIES+=1
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/products' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL%==0 goto :ready
if %RETRIES% GEQ 20 (
    echo.
    echo  [ERRO] Backend nao iniciou em 20 segundos!
    echo  Tente executar manualmente: node server.js
    pause
    exit /b 1
)
echo  Tentativa %RETRIES%...
goto :waitloop

:ready
echo  Backend pronto! (levou %RETRIES%s)
echo.

REM Start frontend (Vite dev server) first, then open browser
echo  Iniciando frontend (Vite)...
cd /d "%~dp0"
start "CJ Frontend" cmd /c "npm run dev"

REM Wait for Vite to start
timeout /t 3 /nobreak >nul

REM Open browser
echo  Abrindo navegador em http://localhost:5173...
start http://localhost:5173

echo.
echo  ============================================
echo    Tudo pronto! Pressione qualquer tecla
echo    para encerrar backend e frontend.
echo  ============================================
echo.
pause

REM Cleanup: kill backend and frontend
taskkill /FI "WINDOWTITLE eq CJ Backend*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq CJ Frontend*" >nul 2>&1
