$exePath = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\target\release\roninplex.exe"

Write-Host "Starting roninplex.exe..."
$proc = Start-Process -FilePath $exePath -PassThru

Start-Sleep -Seconds 4

if ($proc.HasExited) {
    Write-Host "FAIL: roninplex.exe crashed immediately with exit code $($proc.ExitCode)"
    exit 1
}

Write-Host "SUCCESS: roninplex.exe running (PID: $($proc.Id))"

# Check sidecar processes
$animeProcs = Get-Process -Name "anime-server*" -ErrorAction SilentlyContinue
Write-Host "Sidecar processes found: $($animeProcs.Count)"
foreach ($ap in $animeProcs) {
    Write-Host "  Sidecar PID: $($ap.Id)"
}

Write-Host "Closing roninplex.exe gracefully..."
$proc.CloseMainWindow() | Out-Null
Start-Sleep -Seconds 3

if (-not $proc.HasExited) {
    Write-Host "Terminating process..."
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1
# Check for any zombie processes
$remaining = Get-Process -Name "roninplex*", "anime-server*" -ErrorAction SilentlyContinue
Write-Host "Remaining processes after shutdown: $($remaining.Count)"
if ($remaining.Count -eq 0) {
    Write-Host "CLEAN PROCESS SHUTDOWN VERIFIED: 0 orphaned processes"
} else {
    foreach ($r in $remaining) {
        Write-Host "  Remaining: $($r.Name) (PID: $($r.Id))"
        Stop-Process -Id $r.Id -Force -ErrorAction SilentlyContinue
    }
}
