@echo off
chcp 65001 > nul
title HogarTV - Push Automatico a GitHub

cd /d "%~dp0"

echo ========================================================
echo   HogarTV - Compilacion y Push Automatico
echo ========================================================

node scripts/push-auto.cjs %*

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] El proceso finalizo con errores.
) else (
    echo.
    echo [OK] Proceso terminado exitosamente.
)

echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
