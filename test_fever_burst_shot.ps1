$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9440
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_fever_burst",
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
        RhythmGame.togglePlay();
        RhythmGame.triggerFeverBurst();
    "
    Start-Sleep -Milliseconds 450
    Take-Shot "$outDir\verify_rhythm_fever_ignite.png"
    Write-Host "Done!"

} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait(1000)
    }
    if ($p -and -not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
