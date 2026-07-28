$body = @{
    username = "nvminhc3@edu.vn"
    password = "nvminhc3@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue

if ($response -and $response.data -and $response.data.token) {
    $token = $response.data.token
    try {
        $hs = Invoke-RestMethod -Uri "http://localhost:8080/api/hocsinh" -Method Get -Headers @{ Authorization = "Bearer $token" }
        $hs.data | Select-Object -First 3 | ConvertTo-Json -Depth 5 > hs_all.json
        Write-Host "Saved to hs_all.json"
    } catch {
        Write-Host "Failed: $_"
    }
} else {
    Write-Host "Login failed"
}
