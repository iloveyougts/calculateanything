$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9427
$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_test_flight_time",
    "file:///c:/Users/Ksloh/Downloads/usagii/index.html"
) -PassThru
Start-Sleep -Seconds 2
try {
    $version = Invoke-RestMethod -Uri "http://localhost:$port/json"
    $wsUrl = $version[0].webSocketDebuggerUrl
    $ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $ct = [System.Threading.CancellationToken]::None
    $ws.ConnectAsync([uri]$wsUrl, $ct).Wait(3000)

    $seq = 1
    function Eval-Js($code) {
        $id = $script:seq++
        $msg = @{ id = $id; method = 'Runtime.evaluate'; params = @{ expression = $code; returnByValue = $true; awaitPromise = $true } } | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
        $buf = [byte[]]::new(65536)
        $mem = [System.IO.MemoryStream]::new()
        while ($true) {
            $r = $ws.ReceiveAsync([System.ArraySegment[byte]]::new($buf), $ct)
            $r.Wait(5000)
            $mem.Write($buf, 0, $r.Result.Count)
            if ($r.Result.EndOfMessage) {
                $t = [System.Text.Encoding]::UTF8.GetString($mem.ToArray())
                $o = $t | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($o.id -eq $id) { return $o.result.result.value }
                $mem.SetLength(0)
            }
        }
    }

    Eval-Js "USAGI_APP.loginUser('GANTZISHUAN');"
    Start-Sleep -Seconds 1
    # Toss
    Eval-Js "
        var b = document.getElementById('usagi-bouncer');
        var r = b.getBoundingClientRect();
        b.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + 20, clientY: r.top + 20, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200, bubbles: true }));
    "
    for ($i = 1; $i -le 6; $i++) {
        Start-Sleep -Seconds 1
        $status = Eval-Js "
            var c = document.getElementById('usagi-mascot-container');
            var img = document.getElementById('usagi-mascot-img');
            't=' + $i + 's: flying=' + c.classList.contains('is-flying') + ', top=' + c.style.top + ', bottom=' + c.style.bottom + ', imgTransform=' + (img ? img.style.transform : 'none');
        "
        Write-Host $status
    }
} finally {
    if ($ws) { $ws.Dispose() }
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
