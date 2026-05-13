Param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 3000
)

$pidFile = ".tmp_smoke_pid"

try {
  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npmCmd) {
    throw "npm.cmd no esta disponible en PATH"
  }

  $proc = Start-Process -FilePath $npmCmd.Source -ArgumentList @("run", "start", "--", "--hostname", $HostName, "--port", "$Port") -PassThru -WindowStyle Hidden
  $proc.Id | Set-Content $pidFile

  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $res = Invoke-WebRequest -Uri "http://$HostName`:$Port/" -UseBasicParsing -TimeoutSec 2
      if ($res.StatusCode -ge 200) { $ready = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
  }

  if (-not $ready) {
    throw "App failed to start on http://$HostName`:$Port"
  }

  npm run qa:smoke:routes
  if ($LASTEXITCODE -ne 0) { throw "qa:smoke:routes failed" }

  npm run qa:smoke:roles
  if ($LASTEXITCODE -ne 0) { throw "qa:smoke:roles failed" }

  Write-Host "Local smoke QA passed."
}
finally {
  if (Test-Path $pidFile) {
    $appPid = Get-Content $pidFile
    if ($appPid) {
      Stop-Process -Id ([int]$appPid) -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  }
}
