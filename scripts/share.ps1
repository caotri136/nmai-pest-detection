param(
  [int]$FrontendPort = 3000,
  [int]$BackendPort = 8000
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logDir = Join-Path $root ".tunnels"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$backendLog = Join-Path $logDir "backend-tunnel.log"
$frontendLog = Join-Path $logDir "frontend-tunnel.log"

function Start-Tunnel {
  param([int]$Port, [string]$LogPath)
  $errorPath = "$LogPath.err"
  if (Test-Path $LogPath) {
    Remove-Item $LogPath -Force
  }
  if (Test-Path $errorPath) {
    Remove-Item $errorPath -Force
  }
  $args = @(
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=6",
    "-o", "TCPKeepAlive=yes",
    "-o", "ExitOnForwardFailure=yes",
    "-o", "ConnectTimeout=10",
    "-R", "80:localhost:$Port",
    "nokey@localhost.run"
  )
  return Start-Process -FilePath "ssh.exe" -ArgumentList $args -RedirectStandardOutput $LogPath -RedirectStandardError $errorPath -PassThru
}

function Get-TunnelUrl {
  param([string]$LogPath, [int]$TimeoutSec = 40)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $regex = [regex]"https://[a-z0-9-]+\.lhr\.life"
  while ((Get-Date) -lt $deadline) {
    $content = ""
    if (Test-Path $LogPath) {
      $content += (Get-Content $LogPath -Raw)
    }
    $errorPath = "$LogPath.err"
    if (Test-Path $errorPath) {
      $content += (Get-Content $errorPath -Raw)
    }
    if ($content) {
      $match = $regex.Match($content)
      if ($match.Success) {
        return $match.Value
      }
    }
    Start-Sleep -Milliseconds 500
  }
  return $null
}

function Run-Cmd {
  param([string]$Command, [string]$Label)
  $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $Command -Wait -PassThru
  if ($proc.ExitCode -ne 0) {
    throw "$Label failed (exit $($proc.ExitCode))."
  }
}

function Set-EnvValue {
  param([string]$Path, [string]$Key, [string]$Value)
  $newLine = "$Key=$Value"
  $content = ""
  if (Test-Path $Path) {
    $content = Get-Content $Path -Raw
  }
  $lines = @()
  if ($content) {
    $lines = $content -split "`r?`n"
  }
  $lines = $lines | Where-Object { $_ -and ($_ -notmatch "^\s*$Key=") -and ($_ -notmatch "${Key}=") }
  $lines += $newLine
  Set-Content -Path $Path -Value $lines
}

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d $root && npm run dev:backend" | Out-Null

$backendTunnel = Start-Tunnel -Port $BackendPort -LogPath $backendLog
$backendUrl = Get-TunnelUrl -LogPath $backendLog

Run-Cmd "cd /d $root && npm run build" "Frontend build"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d $root && npm run start -- -p $FrontendPort" | Out-Null

$frontendTunnel = Start-Tunnel -Port $FrontendPort -LogPath $frontendLog
$frontendUrl = Get-TunnelUrl -LogPath $frontendLog

$frontendDisplay = if ($frontendUrl) { $frontendUrl } else { "<pending>" }
$backendDisplay = if ($backendUrl) { $backendUrl } else { "<pending>" }
$linksPath = Join-Path $logDir "links.txt"
$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
@(
  "Timestamp: $timestamp",
  "Frontend: $frontendDisplay",
  "Backend: $backendDisplay"
) | Set-Content -Path $linksPath
Write-Output ""
Write-Output ("Frontend tunnel: {0}" -f $frontendDisplay)
Write-Output ("Backend tunnel:  {0}" -f $backendDisplay)
Write-Output ("Tunnel logs:     {0}" -f $logDir)
Write-Output ("Links file:      {0}" -f $linksPath)
Write-Output "Close the ssh.exe processes to stop sharing."
