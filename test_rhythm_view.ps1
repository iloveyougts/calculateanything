$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9430
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_rhythm_view",
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

    Write-Host "=== 1. Login and switchTab to games ==="
    Eval-Js "
        window.alert = function(){};
        window.confirm = function(){ return true; };
        USAGI_APP.loginUser('gts');
        USAGI_APP.showAuthModal(false);
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        USAGI_APP.switchTab('games');
        switchGameSubtab('rhythm');
        RhythmGame.init();
    "
    Start-Sleep -Seconds 1

    Write-Host "=== 2. Verify Rhythm Game Screen ==="
    Take-Shot "$outDir\verify_rhythm_panel_main.png"

    Write-Host "=== 3. Open Song Picker ==="
    Eval-Js "
        RhythmGame.openSongPicker();
    "
    Start-Sleep -Milliseconds 500
    Take-Shot "$outDir\verify_rhythm_picker_open.png"

    Write-Host "=== 4. Select a Song & Trigger 5-Perfect Fever ==="
    Eval-Js "
        RhythmGame.selectSong('gaobai_jay');
        RhythmGame.togglePlay();
        // Trigger 5 perfects directly
        for (let i = 0; i < 5; i++) {
            // simulate perfect notes
            RhythmGame.hitLane(i % 4);
        }
    "
    Start-Sleep -Milliseconds 400
    Take-Shot "$outDir\verify_rhythm_fever_real.png"

    Write-Host "=== 5. Switch to Taiko Mode ==="
    Eval-Js "
        RhythmGame.switchMode('taiko');
        RhythmGame.hitTaiko('don');
    "
    Start-Sleep -Milliseconds 400
    Take-Shot "$outDir\verify_rhythm_taiko_real.png"

    Write-Host "=== 6. Open Settlement Evaluation ==="
    Eval-Js "
        RhythmGame.openSettle();
    "
    Start-Sleep -Milliseconds 400
    Take-Shot "$outDir\verify_rhythm_settle_real.png"

    Write-Host "Done!"

} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait(1000)
    }
    if ($p -and -not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
