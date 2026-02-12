@echo off
chcp 65001 >nul
title Creme Jundiaí Manager

:: Check if Vite dev server is already running on port 5173
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul 2>&1

if %errorlevel%==0 (
    echo [✓] Aplicativo ja esta rodando. Abrindo no navegador...
    start "" "http://localhost:5173"
) else (
    echo [→] Iniciando o aplicativo...
    cd /d "%~dp0"
    start "" "http://localhost:5173"
    npm run dev
)
