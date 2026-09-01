$ErrorActionPreference = "Stop"

$releaseDir = "release-artifacts"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

$portableDir = "$releaseDir\RoninPLEX_2.0.1_Portable"
if (Test-Path $portableDir) {
    Remove-Item -Recurse -Force $portableDir
}
New-Item -ItemType Directory -Path $portableDir | Out-Null

Write-Host "Copying executables to Portable directory..."
Copy-Item "src-tauri\target\release\roninplex.exe" -Destination "$portableDir\RoninPLEX.exe" -Force
Copy-Item "src-tauri\bin\anime-server-*.exe" -Destination $portableDir -Force

Write-Host "Zipping Portable directory..."
$zipPath = "$releaseDir\RoninPLEX_2.0.1_Portable.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}
Compress-Archive -Path "$portableDir\*" -DestinationPath $zipPath -Force

Write-Host "Release artifacts prepared successfully."
