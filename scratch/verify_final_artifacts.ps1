$exePath = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\target\release\roninplex.exe"
$nsisPath = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\target\release\bundle\nsis\RoninPLEX_2.1.1_x64-setup.exe"
$msiPath = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\target\release\bundle\msi\RoninPLEX_2.1.1_x64_en-US.msi"

$paths = @($exePath, $nsisPath, $msiPath)

foreach ($p in $paths) {
    if (Test-Path $p) {
        $item = Get-Item $p
        Write-Host "PATH: $($item.FullName)"
        Write-Host "SIZE: $($item.Length) bytes ($([Math]::Round($item.Length / 1MB, 2)) MB)"
        Write-Host "TIMESTAMP: $($item.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
        
        # Verify PE / MSI Header
        $stream = [System.IO.File]::OpenRead($p)
        $bytes = New-Object byte[] 4
        $stream.Read($bytes, 0, 4) | Out-Null
        $stream.Close()

        $isPE = ($bytes[0] -eq 0x4D -and $bytes[1] -eq 0x5A) # MZ
        $isMSI = ($bytes[0] -eq 0xD0 -and $bytes[1] -eq 0xCF) # OLE CFB
        $valid = if ($isPE) { "VALID PE BINARY (MZ header verified)" } elseif ($isMSI) { "VALID MSI PACKAGE (OLE Compound Document verified)" } else { "UNKNOWN HEADER" }
        Write-Host "HEADER: $valid"
        Write-Host "--------------------------------------------------"
    } else {
        Write-Host "MISSING: $p"
    }
}
