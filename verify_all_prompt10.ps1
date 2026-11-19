$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9430
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_all_final",
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

    Write-Host "=== 1. Login as GANTZISHUAN ==="
    Eval-Js "
        window.alert = function(){};
        window.confirm = function(){ return true; };
        USAGI_APP.loginUser('GANTZISHUAN');
        USAGI_APP.showAuthModal(false);
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
    "
    Start-Sleep -Seconds 1

    # Check 1: Usagi position on start
    $initPos = Eval-Js "
        var c = document.getElementById('usagi-mascot-container');
        var rect = c.getBoundingClientRect();
        'left=' + rect.left + ', right=' + rect.right + ', top=' + rect.top + ', bottom=' + rect.bottom + ', windowW=' + window.innerWidth;
    "
    Write-Host "Initial Usagi Pos: $initPos"
    Take-Shot "$outDir\verify_init_bottom_right.png"

    # Check 2: Toss Usagi to the left and wait for landing
    Write-Host "=== 2. Toss Usagi ==="
    Eval-Js "
        var bouncer = document.getElementById('usagi-bouncer');
        var rect = bouncer.getBoundingClientRect();
        var startX = rect.left + rect.width / 2;
        var startY = rect.top + rect.height / 2;
        bouncer.dispatchEvent(new MouseEvent('mousedown', { clientX: startX, clientY: startY, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200, bubbles: true }));
    "
    # Wait for landing
    Start-Sleep -Seconds 3

    $landPos = Eval-Js "
        var c = document.getElementById('usagi-mascot-container');
        var img = document.getElementById('usagi-mascot-img');
        var rect = c.getBoundingClientRect();
        'landed_left=' + rect.left + ', bottom=' + rect.bottom + ', img_transform=' + img.style.transform;
    "
    Write-Host "Landed Usagi: $landPos"
    Take-Shot "$outDir\verify_tossed_landed_upright.png"

    # Check 3: Cycle Poses
    Write-Host "=== 3. Cycle Pose to Prone ==="
    Eval-Js "UsagiPetManager.setPose('prone', true);"
    Start-Sleep -Milliseconds 600
    Take-Shot "$outDir\verify_pose_prone.png"

    Write-Host "=== 4. Cycle Pose to Sitting ==="
    Eval-Js "UsagiPetManager.setPose('sitting', true);"
    Start-Sleep -Milliseconds 600
    Take-Shot "$outDir\verify_pose_sitting.png"

    Write-Host "=== 5. Cycle Pose to Rolling ==="
    Eval-Js "UsagiPetManager.setPose('rolling', true);"
    Start-Sleep -Milliseconds 600
    Take-Shot "$outDir\verify_pose_rolling.png"

    Write-Host "=== 6. Back to Standing ==="
    Eval-Js "UsagiPetManager.setPose('standing', true);"
    Start-Sleep -Milliseconds 600
    Take-Shot "$outDir\verify_pose_standing.png"

    # Check 7: Open Rhythm Game
    Write-Host "=== 7. Switch to Rhythm Game ==="
    Eval-Js "
        USAGI_APP.switchTab('games');
        window.openGame('rhythm');
    "
    Start-Sleep -Seconds 1
    Take-Shot "$outDir\verify_rhythm_game_panel.png"

    # Check 8: Test 4x Speed & Catch Mode
    Write-Host "=== 8. Test 4x Speed & Catch Mode ==="
    Eval-Js "
        RhythmGame.setSpeed(4);
        RhythmGame.switchMode('catch');
        if (!RhythmGame.isPlaying) RhythmGame.togglePlay();
    "
    Start-Sleep -Milliseconds 900
    Take-Shot "$outDir\verify_rhythm_catch_4x.png"

    # Check 9: Test Circle Mode
    Write-Host "=== 9. Test Circle Mode ==="
    Eval-Js "
        RhythmGame.setSpeed(2);
        RhythmGame.switchMode('circle');
    "
    Start-Sleep -Milliseconds 900
    Take-Shot "$outDir\verify_rhythm_circle_2x.png"

    # Check 10: Song picker modal
    Write-Host "=== 10. Test Song Picker Modal ==="
    Eval-Js "
        RhythmGame.openSongPicker();
    "
    Start-Sleep -Milliseconds 600
    Take-Shot "$outDir\verify_rhythm_song_picker_modal.png"

    Write-Host "ALL VERIFICATION COMPLETE!"
} finally {
    if ($ws) { $ws.Dispose() }
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
