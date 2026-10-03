@echo off
rem DeepSeek Harness web launcher: sessions persist in %USERPROFILE%\.dsh
rem The port prompt and occupancy probe live in dsh-web.ps1: cmd's batch parser
rem mis-reads a UTF-8 script under chcp 65001, so this shell stays ASCII.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dsh-web.ps1"
