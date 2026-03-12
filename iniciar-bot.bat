@echo off
title RafaelaSommer

echo =====================================
echo   Iniciando GitHub Profile Bot
echo =====================================

cd /d %~dp0

echo.
echo Verificando repositorio...

git config --get remote.origin.url > temp_repo.txt
set /p REPO=<temp_repo.txt
del temp_repo.txt

echo Repositorio atual:
echo %REPO%
echo.

echo %REPO% | find "RafaelaSommer" >nul

if errorlevel 1 (
    echo ❌ ERRO: Repositorio incorreto!
    echo O bot foi bloqueado para evitar push errado.
    pause
    exit
)

echo ✅ Repositorio correto.

echo.
echo Instalando dependencias...
call npm install

echo.
echo Iniciando bot...
node scripts/bot-local.js

pause