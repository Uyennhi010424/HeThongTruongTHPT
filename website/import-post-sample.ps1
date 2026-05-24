$json = Get-Content -Raw 'website/import-sample-students.json' | ConvertFrom-Json
foreach ($s in $json) {
  $body = $s | ConvertTo-Json -Depth 10
  try {
    Write-Output ("Posting: " + $s.hoTen)
    $r = Invoke-RestMethod -Uri 'http://localhost:8081/api/hocsinh' -Method Post -Body $body -ContentType 'application/json; charset=utf-8'
    $r | ConvertTo-Json -Depth 6 | Write-Output
  } catch {
    Write-Output ("ERROR creating " + $s.hoTen + ": " + $_.Exception.Message)
    if ($_.Exception.Response) {
      try {
        $resp = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($resp)
        $reader.ReadToEnd() | Write-Output
      } catch {}
    }
  }
}
Write-Output "Fetch matches"
$all = Invoke-RestMethod -Uri 'http://localhost:8081/api/hocsinh' -Method Get -UseBasicParsing
$matches = $all.data | Where-Object { $_.hoTen -like 'Auto Excel*' }
$matches | ConvertTo-Json -Depth 6 | Write-Output
