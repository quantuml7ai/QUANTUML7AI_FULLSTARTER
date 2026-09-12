param(
  [string]$AndroidRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$AdbPath = 'adb',
  [string]$ApkPath = ''
)

$ErrorActionPreference = 'Stop'
Set-Location $AndroidRoot

function Read-AndroidSdkDir {
  param([string]$Root)

  $localPropertiesPath = Join-Path $Root 'local.properties'
  if (-not (Test-Path $localPropertiesPath)) { return $null }

  $sdkLine = Get-Content -Path $localPropertiesPath |
    Where-Object { $_ -match '^\s*sdk\.dir\s*=' } |
    Select-Object -First 1

  if (-not $sdkLine) { return $null }

  $raw = ($sdkLine -replace '^\s*sdk\.dir\s*=', '').Trim()
  return $raw.Replace('\:', ':').Replace('\\', '\')
}

if (-not $ApkPath) {
  $ApkPath = Join-Path $AndroidRoot 'app/build/outputs/apk/debug/app-debug.apk'
}

if (-not (Test-Path $ApkPath)) {
  throw "APK not found: $ApkPath. Run tools/build-debug-apk.ps1 first."
}

$adbCommand = Get-Command $AdbPath -ErrorAction SilentlyContinue
if (-not $adbCommand) {
  $sdkDir = Read-AndroidSdkDir -Root $AndroidRoot
  $adbFromSdk = if ($sdkDir) { Join-Path $sdkDir 'platform-tools\adb.exe' } else { $null }
  if ($adbFromSdk -and (Test-Path $adbFromSdk)) {
    $AdbPath = $adbFromSdk
    $adbCommand = Get-Command $AdbPath -ErrorAction SilentlyContinue
  }
}

if (-not $adbCommand) {
  throw "adb was not found by path '$AdbPath'. Use Android SDK platform-tools adb.exe or LDPlayer adb.exe."
}

Write-Host 'Connected Android/LDPlayer devices:' -ForegroundColor Cyan
& $adbCommand.Source devices

Write-Host ''
Write-Host "Installing $ApkPath" -ForegroundColor Cyan
& $adbCommand.Source install -r $ApkPath

Write-Host ''
Write-Host 'APK install command completed.' -ForegroundColor Green
