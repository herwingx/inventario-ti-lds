@echo off
chcp 65001 >nul 2>&1
REM Script para ejecutar inventario de Windows sin problemas de políticas
REM Este archivo .bat ejecuta el PowerShell con bypass automáticamente

echo =========================================
echo    INVENTARIO AUTOMATIZADO - WINDOWS
echo =========================================
echo.
echo IMPORTANTE: Este script ENVIA los datos al servidor
echo Si solo quiere generar JSON local, use: generar_json_windows.bat (no incluido aqui)
echo.
echo Ejecutando script de PowerShell con bypass...
echo.

REM Ejecutar PowerShell con bypass de políticas de ejecución
REM "%~dp0" asegura que el script de PowerShell se encuentre sin importar desde donde se ejecute este .bat.
PowerShell.exe -ExecutionPolicy Bypass -Command "& '%~dp0inventario_windows.ps1' -SendToServer"

echo.
echo =========================================
echo Proceso completado
echo =========================================
echo.
echo Presione cualquier tecla para continuar...
pause >nul