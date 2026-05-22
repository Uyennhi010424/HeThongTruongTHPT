# Import dump SQL vào MySQL (hethongthpt)
# Chạy: powershell -ExecutionPolicy Bypass -File scripts\import-db.ps1

$mysqlCandidates = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "mysql"
)

$mysql = $mysqlCandidates | Where-Object { Test-Path $_ -or (Get-Command $_ -ErrorAction SilentlyContinue) } | Select-Object -First 1
if (-not $mysql) {
    Write-Error "Không tìm thấy mysql.exe. Cài MySQL hoặc thêm vào PATH."
    exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$dumpDir = Join-Path $root "Dump20260521"
$password = "LiChaengisreal1127@"
$user = "root"

& $mysql -u $user "-p$password" -e "CREATE DATABASE IF NOT EXISTS hethongthpt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

$files = Get-ChildItem $dumpDir -Filter "hethongthpt_*.sql" | Sort-Object Name
foreach ($f in $files) {
    Write-Host "Importing $($f.Name)..."
    & $mysql -u $user "-p$password" hethongthpt -e "source $($f.FullName -replace '\\','/')"
}

Write-Host "Done. Database: hethongthpt"
