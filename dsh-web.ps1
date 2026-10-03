# DeepSeek Harness web launcher: ask for the port, refuse an occupied one, then
# serve. Sessions persist in %USERPROFILE%\.dsh (owned by dsh-web.bat's cd).
$DefaultPort = 3080

# Listening PIDs on one port. Get-NetTCPConnection is the direct read; the
# netstat parse is the fallback for hosts without the NetTCPIP module.
function Get-ListeningPids {
  param([int]$Port)
  try {
    return @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop |
      Select-Object -ExpandProperty OwningProcess)
  } catch {
    $found = @()
    foreach ($line in (netstat -ano | Select-String 'LISTENING')) {
      $fields = @($line.ToString().Trim() -split '\s+')
      if ($fields.Count -ge 5 -and $fields[1] -match ":$Port`$") { $found += [int]$fields[4] }
    }
    return $found
  }
}

while ($true) {
  $answer = Read-Host "请输入 Web UI 端口（直接回车使用 $DefaultPort）"
  $text = if ([string]::IsNullOrWhiteSpace($answer)) { "$DefaultPort" } else { $answer.Trim() }
  $port = 0
  if ($text -notmatch '^\d+$' -or -not [int]::TryParse($text, [ref]$port) -or $port -lt 1 -or $port -gt 65535) {
    Write-Host "[错误] 端口无效：$text（请输入 1-65535 之间的数字）" -ForegroundColor Red
    continue
  }

  $owners = @(Get-ListeningPids -Port $port | Sort-Object -Unique)
  if ($owners.Count -eq 0) { break }

  Write-Host ''
  Write-Host "[错误] 端口 $port 已被占用：" -ForegroundColor Red
  foreach ($owner in $owners) {
    $name = (Get-Process -Id $owner -ErrorAction SilentlyContinue).ProcessName
    $command = (Get-CimInstance Win32_Process -Filter "ProcessId=$owner" -ErrorAction SilentlyContinue).CommandLine
    Write-Host "  PID $owner$(if ($name) { "  $name" })"
    if ($command) { Write-Host "    $command" }
  }
  Write-Host ''
  $retry = Read-Host '输入 r 换一个端口，直接回车退出'
  if ($retry -notmatch '^[rR]$') { exit 1 }
}

$url = "http://127.0.0.1:$port"
Write-Host "正在启动 Web UI: $url"

# Open the browser once the port accepts connections, so a slow source launch
# does not land on a connection-refused tab.
$watcher = "for(`$i=0;`$i -lt 240;`$i++){ `$c=New-Object Net.Sockets.TcpClient; try{ `$c.Connect('127.0.0.1',$port); `$c.Close(); Start-Process '$url'; break } catch { Start-Sleep -Milliseconds 500 } finally { `$c.Dispose() } }"
$null = Start-Process powershell -ArgumentList '-NoProfile', '-WindowStyle', 'Hidden', '-Command', $watcher -WindowStyle Hidden

& pnpm dsh web --port $port
$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Host ''
  Write-Host "[错误] Web UI 启动失败（退出码 $code），请查看上面的输出。" -ForegroundColor Red
  $null = Read-Host '按回车关闭'
}
exit $code
