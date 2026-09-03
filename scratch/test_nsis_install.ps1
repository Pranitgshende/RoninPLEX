$nsisInstaller = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\target\release\bundle\nsis\RoninPLEX_2.1.1_x64-setup.exe"
$installDir = "$env:LOCALAPPDATA\RoninPLEX"
$installedExe = "$installDir\roninplex.exe"

Write-Host "Running NSIS silent install: $nsisInstaller /S ..."
$installerProc = Start-Process -FilePath $nsisInstaller -ArgumentList "/S" -PassThru -Wait
Write-Host "NSIS installer exited with code: $($installerProc.ExitCode)"

Start-Sleep -Seconds 2

if (Test-Path $installedExe) {
    $item = Get-Item $installedExe
    Write-Host "SUCCESS: Installed executable verified at: $($item.FullName)"
    Write-Host "SIZE: $($item.Length) bytes"
    Write-Host "TIMESTAMP: $($item.LastWriteTime)"
    
    # Launch installed app
    Write-Host "Launching installed RoninPLEX.exe..."
    $appProc = Start-Process -FilePath $installedExe -PassThru
    Start-Sleep -Seconds 4

    if ($appProc.HasExited) {
        Write-Host "FAIL: Installed app exited immediately with code: $($appProc.ExitCode)"
        exit 1
    } else {
        Write-Host "SUCCESS: Installed RoninPLEX is running smoothly (PID: $($appProc.Id))"
        Stop-Process -Id $appProc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "Closed installed application."
    }
} else {
    Write-Host "FAIL: Installed executable not found at: $installedExe"
    exit 1
}

# Clean any sidecar or lingering processes
Get-Process -Name "roninplex*", "anime-server*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "PROCESS CLEANUP: Complete."
