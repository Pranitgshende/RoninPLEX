$procs = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match "roninplex|anime-server" }
if ($procs -and $procs.Count -gt 0) {
    Write-Host "FOUND $($procs.Count) PROCESSES:"
    $procs | Format-Table Id, ProcessName
} else {
    Write-Host "ZERO_PROCESSES_CONFIRMED"
}
