$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$port = 9412
$outDir = 'C:\Users\Ksloh\.gemini\antigravity\brain\50cb66bb-9576-46da-be05-9cb49eff89cc'

$p = Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=$port",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    "--user-data-dir=$env:TEMP\chrome_verify_toss_final",
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

    Write-Host "=== 2. Drag Usagi to Left-Top (X=100, Y=140) and release ==="
    $flightInfo = Eval-Js "
        var bouncer = document.getElementById('usagi-bouncer');
        var rect = bouncer.getBoundingClientRect();
        var startX = rect.left + rect.width / 2;
        var startY = rect.top + rect.height / 2;
        
        // Grab Usagi
        bouncer.dispatchEvent(new MouseEvent('mousedown', { clientX: startX, clientY: startY, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 140, bubbles: true }));
        
        // Release from top-left
        window.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 140, bubbles: true }));
        
        var container = document.getElementById('usagi-mascot-container');
        'flying_started: ' + container.classList.contains('is-flying') + ', left=' + container.style.left + ', top=' + container.style.top;
    "
    Write-Host "Flight status: $flightInfo"
    Start-Sleep -Milliseconds 450
    Take-Shot "$outDir\verify_toss_slow_float.png"

    Write-Host "=== 3. Wait 3 seconds for Usagi to float down and land firmly on the floor ==="
    Start-Sleep -Milliseconds 3000
    
    $landedInfo = Eval-Js "
        var container = document.getElementById('usagi-mascot-container');
        var bouncer = document.getElementById('usagi-bouncer');
        var bubble = document.getElementById('usagi-speech-bubble');
        var dock = document.getElementById('usagi-assistant-dock');
        var cRect = container.getBoundingClientRect();
        var bRect = bouncer.getBoundingClientRect();
        var bubRect = bubble ? bubble.getBoundingClientRect() : null;
        var dockRect = dock ? dock.getBoundingClientRect() : null;
        var isLeft = cRect.left < 200;
        var isBottom = (window.innerHeight - bRect.bottom) < 50;
        var bubbleAttached = bubRect && (bRect.top - bubRect.bottom < 30) && (bubRect.top >= 0);
        
        JSON.stringify({
            containerLeft: cRect.left,
            containerRightStyle: container.style.right,
            isLeft: isLeft,
            isBottom: isBottom,
            bubbleAttached: bubbleAttached,
            bubbleBottom: bubRect ? bubRect.bottom : null,
            bouncerTop: bRect.top,
            speechText: document.getElementById('usagi-speech-text').innerText,
            isRoaming: UsagiPetManager.isRoaming()
        });
    "
    Write-Host "Landed info: $landedInfo"
    Take-Shot "$outDir\verify_toss_left_landed.png"

    Write-Host "=== 4. Test Period Recording Empathy ==="
    Eval-Js "
        USAGI_APP.addPeriodRecord('2026-11-19', '2026-11-24', '正常', '轻微', '乌萨奇暖水袋揉肚肚');
    "
    Start-Sleep -Seconds 1
    $periodSpeech = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    Write-Host "Period Speech: $periodSpeech"
    Take-Shot "$outDir\verify_period_empathy_bubble.png"

    Write-Host "=== 5. Test Sad/Emo Mood Empathy ==="
    Eval-Js "
        USAGI_APP.addMood('emo', ['肚子疼', '疲惫'], '今天有点委屈难过...');
    "
    Start-Sleep -Seconds 1
    $emoSpeech = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    Write-Host "Emo Speech: $emoSpeech"
    Take-Shot "$outDir\verify_emo_empathy_bubble.png"

    Write-Host "=== 6. Test Happy Celebration Empathy ==="
    Eval-Js "
        USAGI_APP.addMood('happy', [], '今天和男朋友聊天超开心！呀哈！');
    "
    Start-Sleep -Seconds 1
    $happySpeech = Eval-Js "document.getElementById('usagi-speech-text').innerText;"
    Write-Host "Happy Speech: $happySpeech"
    Take-Shot "$outDir\verify_happy_celebrate_bubble.png"

    Write-Host "=== All Empathy and Physics Tests Finished! ==="
}
finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
    }
    if ($p -and !$p.HasExited) {
        Stop-Process -Id $p.Id -Force
    }
}
