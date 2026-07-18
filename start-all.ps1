# Script khoi dong ca backend va frontend
# Su dung: .\start-all.ps1

$backendPort = 8080
$frontendPort = 5173

Write-Host "=== Khoi dong he thong truong THPT ===" -ForegroundColor Cyan

# === BACKEND ===
Write-Host "`n[1/2] Khoi dong Backend (port $backendPort)..." -ForegroundColor Yellow

# Kill process cu tren port backend
$processIds = netstat -ano | Select-String ":$backendPort\s" | Select-String "LISTENING" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique

foreach ($pid in $processIds) {
    if ($pid -match '^\d+$' -and $pid -ne "0") {
        Write-Host "  Killing old process PID $pid..." -ForegroundColor DarkYellow
        taskkill /F /PID $pid 2>$null
    }
}

Start-Sleep -Seconds 1

# Start backend trong background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    mvn spring-boot:run 2>&1
}

Write-Host "  Backend dang khoi dong..." -ForegroundColor Green

# Doi backend san sang (toi da 60s)
$waited = 0
while ($waited -lt 60) {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$backendPort/actuator/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "  Backend san sang! (doi ${waited}s)" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "  Dang khoi dong... (${waited}s)" -ForegroundColor DarkGray
    }
}

# === FRONTEND ===
Write-Host "`n[2/2] Khoi dong Frontend (port $frontendPort)..." -ForegroundColor Yellow

# Kill process cu tren port frontend
$processIds = netstat -ano | Select-String ":$frontendPort\s" | Select-String "LISTENING" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique

foreach ($pid in $processIds) {
    if ($pid -match '^\d+$' -and $pid -ne "0") {
        Write-Host "  Killing old process PID $pid..." -ForegroundColor DarkYellow
        taskkill /F /PID $pid 2>$null
    }
}

Start-Sleep -Seconds 1

# Start frontend
Set-Location website
Start-Process npm -ArgumentList "run", "dev" -NoNewWindow

Write-Host "`n=== He thong da khoi dong ===" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:$backendPort" -ForegroundColor White
Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "`nNhan Ctrl+C de tat he thong." -ForegroundColor DarkGray

# Giu script chay de co the dung Ctrl+C
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Write-Host "`nDang tat he thong..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
}
