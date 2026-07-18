@echo off
REM Script start backend - tu dong kill process cu tren port 8080
set PORT=8080

echo Checking port %PORT%...

REM Tim va kill tat ca process dang chiem port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo Killing process PID %%a on port %PORT%...
    taskkill /F /PID %%a >nul 2>&1
)

REM Doi port duoc giai phong
timeout /t 2 /nobreak >nul

echo Starting Spring Boot backend on port %PORT%...
mvn spring-boot:run
