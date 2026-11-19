$filePath = "C:\Users\Ksloh\Downloads\usagii\games.js"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

$startMarker = "/* ============================================================`r`n   6.7. GAME 12: 🎹 乌萨奇心动节奏大师 (Kawaii Rhythm)"
if (-not $content.Contains($startMarker)) {
    $startMarker = "/* ============================================================`n   6.7. GAME 12: 🎹 乌萨奇心动节奏大师 (Kawaii Rhythm)"
}

$endMarker = "window.RhythmGame = RhythmGame;"

$startIndex = $content.IndexOf($startMarker)
if ($startIndex -lt 0) {
    Write-Host "Start marker not found!"
    exit 1
}

$endIndex = $content.IndexOf($endMarker, $startIndex)
if ($endIndex -lt 0) {
    Write-Host "End marker not found!"
    exit 1
}
$endIndex += $endMarker.Length

$pyPath = "C:\Users\Ksloh\Downloads\usagii\scratch\replace_rhythm.py"
$pyContent = [System.IO.File]::ReadAllText($pyPath, [System.Text.Encoding]::UTF8)
$prefix = "rhythm_code = '''"
$suffix = "'''"
$pStart = $pyContent.IndexOf($prefix) + $prefix.Length
$pEnd = $pyContent.IndexOf($suffix, $pStart)
$replacement = $pyContent.Substring($pStart, $pEnd - $pStart).Trim()

$newContent = $content.Substring(0, $startIndex) + $replacement + $content.Substring($endIndex)
[System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: Replaced RhythmGame in games.js via PowerShell!"
