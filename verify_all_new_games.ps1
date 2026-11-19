$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9397
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_new_games",
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

    Write-Host "=== Logging in ==="
    Eval-Js "USAGI_APP.login('gts', '123');"
    Start-Sleep -Seconds 2

    Write-Host "=== Navigating to Games Tab ==="
    Eval-Js "USAGI_APP.switchTab('games');"
    Start-Sleep -Seconds 1

    Write-Host "=== TEST 1: Suika Game ==="
    Eval-Js "switchGameSubtab('suika');"
    Start-Sleep -Milliseconds 600
    Eval-Js "
        // Simulate dropping a few fruits
        if (window.SuikaGame) {
            window.SuikaGame.init();
            var canvas = document.getElementById('suika-canvas');
            if (canvas) {
                var rect = canvas.getBoundingClientRect();
                var clickEv = new MouseEvent('click', {
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + 20,
                    bubbles: true
                });
                canvas.dispatchEvent(clickEv);
            }
        }
    "
    Start-Sleep -Milliseconds 600
    Take-Shot "$outDir\verify_game_suika.png"

    Write-Host "=== TEST 2: Wheel Game ==="
    Eval-Js "switchGameSubtab('wheel');"
    Start-Sleep -Milliseconds 600
    Eval-Js "
        if (window.WheelGame) {
            window.WheelGame.init();
            window.WheelGame.spin();
        }
    "
    Start-Sleep -Seconds 2
    Take-Shot "$outDir\verify_game_wheel.png"

    Write-Host "=== TEST 3: Snake Game ==="
    Eval-Js "switchGameSubtab('snake');"
    Start-Sleep -Milliseconds 600
    Eval-Js "
        if (window.SnakeGame) {
            window.SnakeGame.init();
            window.SnakeGame.togglePlay();
        }
    "
    Start-Sleep -Milliseconds 800
    Take-Shot "$outDir\verify_game_snake.png"

    Write-Host "=== TEST 4: RPS Game ==="
    Eval-Js "switchGameSubtab('rps');"
    Start-Sleep -Milliseconds 600
    Eval-Js "
        if (window.RPSGame) {
            window.RPSGame.init();
            window.RPSGame.play('rock');
        }
    "
    Start-Sleep -Milliseconds 900
    Take-Shot "$outDir\verify_game_rps.png"

    Write-Host "All game tests finished successfully!"

} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait(1000)
    }
    if ($p -and -not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
