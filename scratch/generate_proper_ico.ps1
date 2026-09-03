Add-Type -AssemblyName System.Drawing

function New-ProperWindowsIco {
    param(
        [string]$SourcePngPath,
        [string]$DestinationIcoPath
    )

    $srcBmp = [System.Drawing.Bitmap]::FromFile($SourcePngPath)

    # Standard Windows icon sizes
    $sizes = @(16, 24, 32, 48, 64, 128, 256)
    
    # Store images data
    $imageDataList = @()
    $dirEntries = @()

    foreach ($s in $sizes) {
        # Create resized high-quality 32bpp ARGB bitmap
        $resized = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($resized)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($srcBmp, 0, 0, $s, $s)
        $g.Dispose()

        if ($s -ge 128) {
            # 128 and 256 as PNG
            $ms = New-Object System.IO.MemoryStream
            $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $bytes = $ms.ToArray()
            $ms.Dispose()
            $imageDataList += ,$bytes
        } else {
            # 16, 24, 32, 48, 64 as uncompressed 32bpp BGRA DIB with BITMAPINFOHEADER + AND mask
            $ms = New-Object System.IO.MemoryStream
            $bw = New-Object System.IO.BinaryWriter($ms)

            # BITMAPINFOHEADER (40 bytes)
            $bw.Write([uint32]40) # biSize
            $bw.Write([int32]$s)   # biWidth
            $bw.Write([int32]($s * 2)) # biHeight (double for XOR + AND masks)
            $bw.Write([uint16]1)  # biPlanes
            $bw.Write([uint16]32) # biBitCount
            $bw.Write([uint32]0)  # biCompression (BI_RGB = 0)
            $imageSize = $s * $s * 4
            $maskRowBytes = [Math]::Ceiling($s / 32.0) * 4 # row aligned to 32-bit
            $maskSize = [int]($maskRowBytes * $s)
            $bw.Write([uint32]($imageSize + $maskSize)) # biSizeImage
            $bw.Write([int32]0)   # biXPelsPerMeter
            $bw.Write([int32]0)   # biYPelsPerMeter
            $bw.Write([uint32]0)  # biClrUsed
            $bw.Write([uint32]0)  # biClrImportant

            # Pixel data (bottom-up BGRA)
            for ($y = $s - 1; $y -ge 0; $y--) {
                for ($x = 0; $x -lt $s; $x++) {
                    $pixel = $resized.GetPixel($x, $y)
                    $bw.Write([byte]$pixel.B)
                    $bw.Write([byte]$pixel.G)
                    $bw.Write([byte]$pixel.R)
                    $bw.Write([byte]$pixel.A)
                }
            }

            # 1-bit AND mask (bottom-up, 0 = transparent if alpha 0? Actually in 32bpp, 0 in mask means opaque/display, 1 means transparent; but Windows 32bpp ignores AND mask when alpha is present, standard is 0)
            for ($y = $s - 1; $y -ge 0; $y--) {
                for ($byteIdx = 0; $byteIdx -lt $maskRowBytes; $byteIdx++) {
                    $maskByte = 0
                    for ($bit = 0; $bit -lt 8; $bit++) {
                        $x = ($byteIdx * 8) + $bit
                        if ($x -lt $s) {
                            $pixel = $resized.GetPixel($x, $y)
                            if ($pixel.A -eq 0) {
                                $maskByte = $maskByte -bor (1 -shl (7 - $bit))
                            }
                        }
                    }
                    $bw.Write([byte]$maskByte)
                }
            }

            $bytes = $ms.ToArray()
            $bw.Dispose()
            $ms.Dispose()
            $imageDataList += ,$bytes
        }

        $resized.Dispose()
    }

    $srcBmp.Dispose()

    # Now assemble the final ICO file
    $outStream = [System.IO.File]::Create($DestinationIcoPath)
    $outWriter = New-Object System.IO.BinaryWriter($outStream)

    # ICONDIR
    $outWriter.Write([uint16]0) # idReserved
    $outWriter.Write([uint16]1) # idType (1 = icon)
    $outWriter.Write([uint16]$sizes.Count) # idCount

    # Calculate offsets
    # Header: 6 bytes. Entries: count * 16 bytes.
    $offset = 6 + ($sizes.Count * 16)

    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $s = $sizes[$i]
        $w = if ($s -ge 256) { [byte]0 } else { [byte]$s }
        $h = if ($s -ge 256) { [byte]0 } else { [byte]$s }
        $data = $imageDataList[$i]

        $outWriter.Write([byte]$w)
        $outWriter.Write([byte]$h)
        $outWriter.Write([byte]0) # colors
        $outWriter.Write([byte]0) # reserved
        $outWriter.Write([uint16]1) # planes
        $outWriter.Write([uint16]32) # bpp
        $outWriter.Write([uint32]$data.Length) # dwBytesInRes
        $outWriter.Write([uint32]$offset)      # dwImageOffset

        $offset += $data.Length
    }

    # Write image data
    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $outWriter.Write($imageDataList[$i])
    }

    $outWriter.Flush()
    $outWriter.Dispose()
    $outStream.Dispose()
    Write-Host "Generated proper Windows ICO at: $DestinationIcoPath ($offset bytes)"
}

New-ProperWindowsIco "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\src-tauri\icons\icon.png" "C:\Users\prani\.gemini\antigravity\scratch\RoninPLEX\scratch\test_proper.ico"
