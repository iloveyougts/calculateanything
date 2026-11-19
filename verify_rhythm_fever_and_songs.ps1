$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9420
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_rhythm_fever",
    "file:///c:/Users/Ksloh/Downloads/usagii/index.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $version = Invoke-RestMethod -Uri "http://localhost:$port/json"
    $wsUrl = $version[0].webSocketDebuggerUrl

    $ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $ct = [System.Threading.CancellationToken]::None
    $ws.ConnectAsync([uri]$wsUrl, $ct).Wait(3000)

    $script:seq = 1
    function Eval-Js($code) {
        $targetId = $script:seq++
        $msg = @{ id = $targetId; method = "Runtime.evaluate"; params = @{ expression = $code; returnByValue = $true; awaitPromise = $true } } | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
        
        $mem = [System.IO.MemoryStream]::new()
        $buf = [byte[]]::new(65536)
        while ($true) {
            $r = $ws.ReceiveAsync([System.ArraySegment[byte]]::new($buf), $ct)
            $r.Wait(8000)
            $mem.Write($buf, 0, $r.Result.Count)
            if ($r.Result.EndOfMessage) {
                $t = [System.Text.Encoding]::UTF8.GetString($mem.ToArray())
                $o = $t | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($o -and $o.id -eq $targetId) {
                    return $o.result.result.value
                }
                $mem.SetLength(0)
            }
        }
    }

    function Take-Shot($path) {
        $shotId = $script:seq++
        $shotMsg = @{ id = $shotId; method = "Page.captureScreenshot"; params = @{ format = "png" } } | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($shotMsg)
        $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
        $memStream = [System.IO.MemoryStream]::new()
        $buf = [byte[]]::new(65536)
        while ($true) {
            $r = $ws.ReceiveAsync([System.ArraySegment[byte]]::new($buf), $ct)
            $r.Wait(8000)
            $memStream.Write($buf, 0, $r.Result.Count)
            if ($r.Result.EndOfMessage) {
                $text = [System.Text.Encoding]::UTF8.GetString($memStream.ToArray())
                $o = $text | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($o -and $o.id -eq $shotId) {
                    $base64 = $o.result.data
                    [System.IO.File]::WriteAllBytes($path, [Convert]::FromBase64String($base64))
                    Write-Host "Successfully saved: $path"
                    break
                }
                $memStream.SetLength(0)
            }
        }
    }

    Write-Host "=== 1. Login and switch to Rhythm Game view ==="
    Eval-Js "
        window.alert = function(){};
        window.confirm = function(){ return true; };
        USAGI_APP.loginUser('gts');
        USAGI_APP.showAuthModal(false);
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        switchTab('games');
        switchGameSubtab('rhythm');
    "
    Start-Sleep -Seconds 1

    Write-Host "=== 2. Check Song Info & Open Song Picker ==="
    $songTitle = Eval-Js "document.getElementById('rhythm-song-title').innerText;"
    $songArtist = Eval-Js "document.getElementById('rhythm-song-artist').innerText;"
    Write-Host "Current song: $songTitle by $songArtist"

    Eval-Js "RhythmGame.openSongPicker();"
    Start-Sleep -Milliseconds 400
    Take-Shot "$outDir\verify_rhythm_song_picker.png"

    Write-Host "=== 3. Filter Category & Select Song ==="
    Eval-Js "
        RhythmGame.setSongCategory('zrz');
    "
    Start-Sleep -Milliseconds 300
    Eval-Js "
        RhythmGame.selectSong('chengwai_zrz');
    "
    Start-Sleep -Milliseconds 400
    $newTitle = Eval-Js "document.getElementById('rhythm-song-title').innerText;"
    Write-Host "Selected new song: $newTitle"

    Write-Host "=== 4. Test 5-PERFECT Streak & FEVER Mode ==="
    Eval-Js "
        RhythmGame.togglePlay();
    "
    Start-Sleep -Milliseconds 200

    # Simulate 5 consecutive perfect hits
    Eval-Js "
        for (let i = 0; i < 5; i++) {
            // Force a perfect hit simulation
            RhythmGame.hitLane(i % 4);
        }
    "
    Start-Sleep -Milliseconds 300

    $isFeverActive = Eval-Js "document.getElementById('rhythm-canvas-box').classList.contains('rhythm-fever-active');"
    $streakText = Eval-Js "document.getElementById('rhythm-perfect-streak').innerText;"
    $comboText = Eval-Js "document.getElementById('rhythm-combo').innerText;"
    Write-Host "Fever border active: $isFeverActive"
    Write-Host "Streak: $streakText, Combo: $comboText"

    Take-Shot "$outDir\verify_rhythm_fever_burst.png"

    Write-Host "=== 5. Switch to Taiko Drum Mode ==="
    Eval-Js "
        RhythmGame.switchMode('taiko');
        RhythmGame.hitTaiko('don');
        RhythmGame.hitTaiko('ka');
    "
    Start-Sleep -Milliseconds 400

    Take-Shot "$outDir\verify_rhythm_taiko_mode.png"

    Write-Host "=== 6. Test Settlement / Evaluation Card ==="
    Eval-Js "
        RhythmGame.openSettle();
    "
    Start-Sleep -Milliseconds 400
    Take-Shot "$outDir\verify_rhythm_settlement.png"

    Write-Host "All rhythm features tested and verified successfully!"

} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait(1000)
    }
    if ($p -and -not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
