$body = @{
    username = "nvminhc3@edu.vn"
    password = "nvminhc3@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue

if ($response -and $response.data -and $response.data.token) {
    $token = $response.data.token
    Write-Host "Token obtained: $token"
    
    try {
        $dash = Invoke-RestMethod -Uri "http://localhost:8080/api/giaovien/me/dashboard" -Method Get -Headers @{ Authorization = "Bearer $token" }
        Write-Host "Dashboard OK:"
        $dash | ConvertTo-Json -Depth 5 > dash-gv.json
        Write-Host "Saved to dash-gv.json"
    } catch {
        Write-Host "Dashboard failed: $_"
        Write-Host "Response: $($_.Exception.Response | out-null; (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd())"
    }
} else {
    Write-Host "Login failed: $($response | ConvertTo-Json)"
}
