$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9400
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_toss_fix",
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

    Write-Host "=== 1. Logging in via guestLogin ==="
    Eval-Js "await USAGI_APP.guestLogin();"
    Start-Sleep -Seconds 2

    $appState = Eval-Js "document.getElementById('auth-overlay').classList.contains('hidden');"
    Write-Host "Auth overlay hidden: $appState"

    Write-Host "=== 2. Test Fling Toss ==="
    Eval-Js "
        var bouncer = document.getElementById('usagi-bouncer');
        var down = new MouseEvent('mousedown', { clientX: 900, clientY: 700, bubbles: true });
        bouncer.dispatchEvent(down);
        var move = new MouseEvent('mousemove', { clientX: 800, clientY: 450, bubbles: true });
        window.dispatchEvent(move);
        var up = new MouseEvent('mouseup', { clientX: 650, clientY: 200, bubbles: true });
        window.dispatchEvent(up);
    "
    Start-Sleep -Milliseconds 250
    Take-Shot "$outDir\verify_toss_in_air.png"

    Write-Host "=== 3. Wait for Fast Recovery (850ms) ==="
    Start-Sleep -Milliseconds 900
    
    $containerTop = Eval-Js "document.getElementById('usagi-mascot-container').style.top;"
    $containerBottom = Eval-Js "document.getElementById('usagi-mascot-container').style.bottom;"
    $mascotTransform = Eval-Js "document.getElementById('usagi-mascot-img').style.transform;"
    $speechText = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    $rects = Eval-Js "
        var c = document.getElementById('usagi-mascot-container').getBoundingClientRect();
        var d = document.getElementById('usagi-assistant-dock').getBoundingClientRect();
        var b = document.getElementById('usagi-speech-bubble').getBoundingClientRect();
        var u = document.getElementById('usagi-bouncer').getBoundingClientRect();
        JSON.stringify({ 
            containerHeight: c.height, 
            dockTop: d.top, 
            bubbleTop: b.top, 
            usagiTop: u.top,
            gapDockToBubble: b.top - d.bottom,
            gapBubbleToUsagi: u.top - b.bottom
        });
    "

    Write-Host "container.style.top: '$containerTop' (Should be empty)"
    Write-Host "container.style.bottom: '$containerBottom' (Should be active)"
    Write-Host "mascotImg transform: '$mascotTransform'"
    Write-Host "Speech bubble text: $speechText"
    Write-Host "Layout geometry: $rects"

    Take-Shot "$outDir\verify_toss_landed_upright.png"
    Write-Host "Recovery verified successfully!"

} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait(1000)
    }
    if ($p -and -not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
