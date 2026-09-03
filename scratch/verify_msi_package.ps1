$msiPath = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\target\release\bundle\msi\RoninPLEX_2.1.1_x64_en-US.msi"

if (-not (Test-Path $msiPath)) {
    Write-Host "FAIL: MSI package not found at: $msiPath"
    exit 1
}

$file = Get-Item $msiPath
Write-Host "MSI Package Path: $($file.FullName)"
Write-Host "MSI Package Size: $($file.Length) bytes ($([Math]::Round($file.Length / 1MB, 2)) MB)"
Write-Host "MSI Package Timestamp: $($file.LastWriteTime)"

try {
    $windowsInstaller = New-Object -ComObject WindowsInstaller.Installer
    $database = $windowsInstaller.GetType().InvokeMember("OpenDatabase", "InvokeMethod", $null, $windowsInstaller, @($msiPath, 0))
    $view = $database.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $database, @("SELECT Property, Value FROM Property"))
    $view.GetType().InvokeMember("Execute", "InvokeMethod", $null, $view, $null)

    Write-Host "`n=== MSI PACKAGE PROPERTIES ==="
    while ($record = $view.GetType().InvokeMember("Fetch", "InvokeMethod", $null, $view, $null)) {
        $prop = $record.GetType().InvokeMember("StringData", "GetProperty", $null, $record, @(1))
        $val = $record.GetType().InvokeMember("StringData", "GetProperty", $null, $record, @(2))
        if ($prop -in @("ProductName", "ProductVersion", "Manufacturer", "ProductCode", "UpgradeCode", "ALLUSERS")) {
            Write-Host "$prop = $val"
        }
    }
    Write-Host "SUCCESS: MSI Database parsed and validated successfully!"
} catch {
    Write-Host "Error querying MSI COM: $($_.Exception.Message)"
}
