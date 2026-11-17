@echo off
chcp 65001 >nul
title 乌萨奇全能生活手账 · 颜芷萱专属电台服务
echo ==============================================================
echo  🐰 正在为 颜芷萱 (GAN TZI SHUAN) 启动专属全能生活手账...
echo  🚀 本地 HTTP 服务已就绪，100%% 解锁全网 YouTube 视频与无损音乐！
echo ==============================================================
echo.
echo 💡 提示：此窗口在听歌时请保持开启（可最小化），关闭窗口即退出服务。
echo.

start "" "http://localhost:3210/index.html"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$l = New-Object System.Net.HttpListener; $l.Prefixes.Add('http://localhost:3210/'); try { $l.Start() } catch { Write-Host '端口已占用或正在运行中' }; while ($l.IsListening) { $c = $l.GetContext(); $req = $c.Request; $res = $c.Response; $rawPath = $req.Url.AbsolutePath; if ($rawPath -eq '/') { $rawPath = '/index.html' }; $filePath = '.' + [Uri]::UnescapeDataString($rawPath).Replace('/', '\'); if (Test-Path $filePath) { try { $bytes = [System.IO.File]::ReadAllBytes($filePath); $ext = [System.IO.Path]::GetExtension($filePath).ToLower(); $mime = 'text/html; charset=utf-8'; switch ($ext) { '.css' { $mime = 'text/css; charset=utf-8' } '.js' { $mime = 'application/javascript; charset=utf-8' } '.png' { $mime = 'image/png' } '.jpg' { $mime = 'image/jpeg' } '.mp3' { $mime = 'audio/mpeg' } '.sql' { $mime = 'text/plain; charset=utf-8' } }; $res.ContentType = $mime; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } catch {} } else { $res.StatusCode = 404 }; $res.OutputStream.Close() }"
