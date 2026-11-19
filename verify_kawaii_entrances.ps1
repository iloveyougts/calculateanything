$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9396
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,850",
    "--user-data-dir=$env:TEMP\chrome_verify_kawaii_entrances",
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

    Write-Host "=== TEST 1: Switch to Period with Kawaii FX ==="
    Eval-Js "USAGI_APP.switchTab('period');"
    Start-Sleep -Milliseconds 450
    $particlesCount = Eval-Js "document.querySelectorAll('.usagi-float-particle').length;"
    $animName = Eval-Js "window.getComputedStyle(document.getElementById('tab-period')).animationName;"
    Write-Host "Period tab animation: $animName | Floating Usagis count: $particlesCount"
    Take-Shot "$outDir\verify_kawaii_period.png"

    Write-Host "=== TEST 2: Switch to Music with Kawaii FX ==="
    Eval-Js "USAGI_APP.switchTab('music');"
    Start-Sleep -Milliseconds 450
    $animMusic = Eval-Js "window.getComputedStyle(document.getElementById('tab-music')).animationName;"
    Write-Host "Music tab animation: $animMusic"
    Take-Shot "$outDir\verify_kawaii_music.png"

    Write-Host "=== TEST 3: Switch to Expense with Kawaii FX ==="
    Eval-Js "USAGI_APP.switchTab('expense');"
    Start-Sleep -Milliseconds 450
    $animExpense = Eval-Js "window.getComputedStyle(document.getElementById('tab-expense')).animationName;"
    Write-Host "Expense tab animation: $animExpense"
    Take-Shot "$outDir\verify_kawaii_expense.png"

    Write-Host "=== TEST 4: Switch to Cinema with Kawaii FX ==="
    Eval-Js "USAGI_APP.switchTab('cinema');"
    Start-Sleep -Milliseconds 450
    $animCinema = Eval-Js "window.getComputedStyle(document.getElementById('tab-cinema')).animationName;"
    Write-Host "Cinema tab animation: $animCinema"
    Take-Shot "$outDir\verify_kawaii_cinema.png"

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
} finally {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
