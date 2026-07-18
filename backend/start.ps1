# Script start backend - tu dong kill process cu tren port 8080
$port = 8080
$maxRetries = 5

Write-Host "Checking port $port..." -ForegroundColor Cyan

# Tim va kill tat ca process dang chiem port
$processIds = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique

foreach ($pid in $processIds) {
    if ($pid -match '^\d+$' -and $pid -ne "0") {
        Write-Host "Killing process PID $pid on port $port..." -ForegroundColor Yellow
        taskkill /F /PID $pid 2>$null
    }
}

# Doi port duoc giai phong
$retries = 0
while ($retries -lt $maxRetries) {
    $occupied = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    if (-not $occupied) {
        Write-Host "Port $port is free." -ForegroundColor Green
        break
    }
    $retries++
    Write-Host "Waiting for port $port to be released... ($retries/$maxRetries)" -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

if ($retries -ge $maxRetries) {
    Write-Host "WARNING: Port $port may still be in use. Attempting to start anyway..." -ForegroundColor Red
}

Write-Host "Starting Spring Boot backend on port $port..." -ForegroundColor Green
mvn spring-boot:run
