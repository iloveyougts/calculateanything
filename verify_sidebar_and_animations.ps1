$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9397
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,850",
    "--user-data-dir=$env:TEMP\chrome_verify_sidebar_anim",
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
                    Write-Host "Successfully saved screenshot: $path"
                    break
                }
                $memStream.SetLength(0)
            }
        }
    }

    Write-Host "=== TEST 1: Logging in as GTS ==="
    Eval-Js "USAGI_APP.login('gts', '123');"
    Start-Sleep -Seconds 2

    # Check sidebar presence and scrollable box
    $hasBox = Eval-Js "!!document.querySelector('.sidebar-scroll-box');"
    Write-Host "Sidebar scroll box exists: $hasBox"

    Write-Host "=== TEST 2: Scrolling desktop sidebar down to bottom items ==="
    # Scroll sidebar down by 250px
    Eval-Js "
      const box = document.querySelector('.sidebar-scroll-box');
      if (box) box.scrollTop = 250;
    "
    Start-Sleep -Milliseconds 300
    $sbScroll1 = Eval-Js "document.querySelector('.sidebar-scroll-box')?.scrollTop;"
    Write-Host "Sidebar scroll position before clicking music: $sbScroll1"

    Write-Host "=== TEST 3: Clicking '乌萨奇音乐点歌台' (nav-music) ==="
    Eval-Js "USAGI_APP.switchTab('music');"
    Start-Sleep -Milliseconds 500

    $windowScroll = Eval-Js "window.scrollY;"
    $sbScroll2 = Eval-Js "document.querySelector('.sidebar-scroll-box')?.scrollTop;"
    $isMusicActive = Eval-Js "document.getElementById('nav-music')?.classList.contains('active');"
    $animApplied = Eval-Js "window.getComputedStyle(document.getElementById('tab-music')).animationName;"

    Write-Host "Window scrollY (must be 0): $windowScroll"
    Write-Host "Sidebar scroll position after switch (must stay ~250): $sbScroll2"
    Write-Host "Music nav is active: $isMusicActive"
    Write-Host "Music tab animation applied: $animApplied"

    Take-Shot "$outDir\verify_desktop_sidebar_stay.png"

    Write-Host "=== TEST 4: Simulating Nickname modification to 'kim' ==="
    Eval-Js "
      USAGI_APP.data.profile.nickname = 'kim';
      const users = USAGI_APP.getUsers();
      if (users['gts']) users['gts'].nickname = 'kim';
      USAGI_APP.saveUsers(users);
      USAGI_APP.saveData();
      USAGI_APP.renderAll();
    "
    Start-Sleep -Seconds 1
    $nickBefore = Eval-Js "USAGI_APP.data.profile.nickname;"
    Write-Host "Nickname before reload: $nickBefore"

    Write-Host "=== TEST 5: Reloading page to test persistence ==="
    Eval-Js "window.location.reload();"
    Start-Sleep -Seconds 3

    $nickAfter = Eval-Js "USAGI_APP.data.profile.nickname;"
    $dispAfter = Eval-Js "document.getElementById('user-nickname-display')?.innerText;"
    Write-Host "Nickname after reload: $nickAfter | Display: $dispAfter"

    Take-Shot "$outDir\verify_gts_kim_persistent.png"

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
} finally {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
