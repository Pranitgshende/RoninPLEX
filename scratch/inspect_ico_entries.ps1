param([string]$icoPath = "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\icons\icon.ico")
$stream = [System.IO.File]::OpenRead($icoPath)
$reader = New-Object System.IO.BinaryReader($stream)

$idReserved = $reader.ReadUInt16()
$idType     = $reader.ReadUInt16()
$idCount    = $reader.ReadUInt16()

Write-Host "ICO Header: Type=$idType, ImageCount=$idCount"

$entries = @()
for ($i = 0; $i -lt $idCount; $i++) {
    $w = $reader.ReadByte()
    if ($w -eq 0) { $w = 256 }
    $h = $reader.ReadByte()
    if ($h -eq 0) { $h = 256 }
    $colors = $reader.ReadByte()
    $res    = $reader.ReadByte()
    $planes = $reader.ReadUInt16()
    $bpp    = $reader.ReadUInt16()
    $size   = $reader.ReadUInt32()
    $offset = $reader.ReadUInt32()

    $entries += [PSCustomObject]@{
        Index  = $i
        Width  = $w
        Height = $h
        BPP    = $bpp
        Size   = $size
        Offset = $offset
    }
}

foreach ($e in $entries) {
    $stream.Seek($e.Offset, [System.IO.SeekOrigin]::Begin) | Out-Null
    $sig = $reader.ReadBytes(4)
    $isPng = ($sig[0] -eq 0x89 -and $sig[1] -eq 0x50 -and $sig[2] -eq 0x4E -and $sig[3] -eq 0x47)
    $typeStr = if ($isPng) { "PNG" } else { "BMP (DIB)" }

    # If BMP, inspect BITMAPINFOHEADER
    $extra = ""
    if (-not $isPng) {
        $stream.Seek($e.Offset, [System.IO.SeekOrigin]::Begin) | Out-Null
        $biSize = $reader.ReadUInt32()
        $biWidth = $reader.ReadInt32()
        $biHeight = $reader.ReadInt32() # In ICO, height is 2x actual height (image + mask)
        $biPlanes = $reader.ReadUInt16()
        $biBitCount = $reader.ReadUInt16()
        $biCompression = $reader.ReadUInt32()
        $extra = "biBitCount=$biBitCount, biComp=$biCompression, biH=$biHeight"
    }
    Write-Host ("Entry $($e.Index): $($e.Width)x$($e.Height) @ $($e.BPP)bpp, Format=$typeStr, Offset=$($e.Offset), Size=$($e.Size) $extra")
}

$stream.Close()
