@echo off
rem DeepSeek Harness web launcher: sessions persist in %USERPROFILE%\.dsh
cd /d "%~dp0"
start "" /b cmd /c "ping -n 6 127.0.0.1 >nul && start http://127.0.0.1:3080"
pnpm dsh web
