$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9398
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_features",
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

    Write-Host "=== 1. Logging in ==="
    Eval-Js "USAGI_APP.login('gts', '123');"
    Start-Sleep -Seconds 2

    Write-Host "=== 2. Verify UsagiVoice & Reminder on Todo Add ==="
    Eval-Js "USAGI_APP.switchTab('todos');"
    Start-Sleep -Milliseconds 500
    Eval-Js "USAGI_APP.addTodo('陪芷萱挑口红 💄', 'high', '2026-11-20');"
    Start-Sleep -Milliseconds 600
    $speechText = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    Write-Host "Speech bubble text after adding todo: $speechText"
    Take-Shot "$outDir\verify_todo_reminder.png"

    Write-Host "=== 3. Verify Countdown Reminder ==="
    Eval-Js "USAGI_APP.addCountdown('相爱两周年纪念日', '2026-12-01', '💖');"
    Start-Sleep -Milliseconds 600
    $countdownText = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    Write-Host "Speech bubble text after adding countdown: $countdownText"
    Take-Shot "$outDir\verify_countdown_reminder.png"

    Write-Host "=== 4. Verify Calendar Reminder ==="
    Eval-Js "USAGI_APP.switchTab('calendar');"
    Start-Sleep -Milliseconds 500
    Eval-Js "USAGI_APP.addCalendarEvent('2026-11-20', '情侣西餐浪漫约会', '纪念', '18:00', '吃好吃的西餐', 'rose');"
    Start-Sleep -Milliseconds 600
    $calText = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    Write-Host "Speech bubble text after adding calendar event: $calText"
    Take-Shot "$outDir\verify_calendar_reminder.png"

    Write-Host "=== 5. Verify Usagi Toss Physics (丢来丢去) ==="
    # Simulate picking up and tossing Usagi into mid-air
    Eval-Js "
        var container = document.getElementById('usagi-mascot-container');
        var bouncer = document.getElementById('usagi-bouncer');
        if (container && bouncer) {
            // Trigger drag and fling directly
            var down = new MouseEvent('mousedown', { clientX: 500, clientY: 700, bubbles: true });
            bouncer.dispatchEvent(down);
            var move = new MouseEvent('mousemove', { clientX: 600, clientY: 400, bubbles: true });
            window.dispatchEvent(move);
            var up = new MouseEvent('mouseup', { clientX: 650, clientY: 200, bubbles: true });
            window.dispatchEvent(up);
        }
    "
    Start-Sleep -Milliseconds 600
    $isFlying = Eval-Js "document.getElementById('usagi-mascot-container').classList.contains('is-flying');"
    Write-Host "Usagi isFlying in physics: $isFlying"
    Take-Shot "$outDir\verify_usagi_toss.png"

    Write-Host "=== 6. Verify 3 New Games ==="
    Eval-Js "USAGI_APP.switchTab('games');"
    Start-Sleep -Milliseconds 500

    Write-Host "--- Game 10: Sky Hop ---"
    Eval-Js "switchGameSubtab('hop');"
    Start-Sleep -Milliseconds 600
    Eval-Js "if (window.SkyHopGame) SkyHopGame.reset();"
    Start-Sleep -Milliseconds 800
    Take-Shot "$outDir\verify_game_hop.png"

    Write-Host "--- Game 11: Carrot Harvest ---"
    Eval-Js "switchGameSubtab('harvest');"
    Start-Sleep -Milliseconds 600
    Eval-Js "if (window.HarvestGame) { HarvestGame.start(); HarvestGame.whack(0); }"
    Start-Sleep -Milliseconds 800
    Take-Shot "$outDir\verify_game_harvest.png"

    Write-Host "--- Game 12: Rhythm Tiles ---"
    Eval-Js "switchGameSubtab('rhythm');"
    Start-Sleep -Milliseconds 600
    Eval-Js "if (window.RhythmGame) { RhythmGame.togglePlay(); }"
    Start-Sleep -Milliseconds 800
    Take-Shot "$outDir\verify_game_rhythm.png"

    Write-Host "All tests completed!"
} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait(1000)
    }
    if ($p -and -not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
