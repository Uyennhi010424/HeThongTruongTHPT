$api = 'http://localhost:8081/api'

Write-Output "Fetching students..."
$studentsResp = Invoke-RestMethod -Uri "$api/hocsinh" -Method Get -UseBasicParsing
$students = $studentsResp.data
Write-Output ("Students: " + $students.Count)

Write-Output "Fetching parents..."
$parentsResp = Invoke-RestMethod -Uri "$api/phuhuynh" -Method Get -UseBasicParsing
$parents = $parentsResp.data
Write-Output ("Parents: " + $parents.Count)

$matches = 0
$created = 0
$skipped = 0
$errors = @()

foreach ($s in $students) {
    $matches += 1
    # skip if student already has mapping
    try {
        $links = Invoke-RestMethod -Uri "$api/hocsinh/$($s.id)/phuhuynh" -Method Get -UseBasicParsing
        if ($links.data -and $links.data.Count -gt 0) {
            $skipped += 1
            continue
        }
    } catch {
        # continue on error
    }

    $found = $null
    if ($s.sdt) {
        $found = $parents | Where-Object { $_.soDienThoai -eq $s.sdt } | Select-Object -First 1
    }
    if (-not $found -and $s.email) {
        $found = $parents | Where-Object { $_.email -ne $null -and ($_.email.ToLower() -eq $s.email.ToLower()) } | Select-Object -First 1
    }

    if ($found) {
        try {
            $resp = Invoke-RestMethod -Uri "$api/hocsinh/$($s.id)/phuhuynh/$($found.id)" -Method Post -UseBasicParsing -ContentType 'application/json'
            Write-Output "Linked student $($s.id) '$($s.hoTen)' -> parent $($found.id) '$($found.hoTen)'"
            $created += 1
        } catch {
            $errors += "Error linking $($s.id) -> $($found.id): $($_.Exception.Message)"
        }
    } else {
        # try fuzzy: match phone ignoring non-digit, or by last name/email localpart
        $snum = if ($s.sdt) { ($s.sdt -replace '[^0-9]','') } else { '' }
        if ($snum) {
            $found = $parents | Where-Object { ($_.soDienThoai -replace '[^0-9]','') -eq $snum } | Select-Object -First 1
        }
        if ($found) {
            try {
                Invoke-RestMethod -Uri "$api/hocsinh/$($s.id)/phuhuynh/$($found.id)" -Method Post -UseBasicParsing -ContentType 'application/json'
                Write-Output "Linked (fuzzy) student $($s.id) -> parent $($found.id)"
                $created += 1
            } catch {
                $errors += "Error linking fuzzy $($s.id) -> $($found.id): $($_.Exception.Message)"
            }
        } else {
            # no parent found
        }
    }
}

Write-Output "Done. Attempted: $matches, Created: $created, Skipped(existing): $skipped, Errors: $($errors.Count)"
if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Output $_ } }
