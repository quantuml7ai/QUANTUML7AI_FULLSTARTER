param(
  [string]$AndroidRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Set-Location $AndroidRoot

$buildTools = Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" -Directory -ErrorAction Stop |
  Sort-Object Name -Descending |
  Select-Object -First 1
$apksigner = Join-Path $buildTools.FullName 'apksigner.bat'
if (-not (Test-Path $apksigner)) {
  throw "apksigner was not found in $($buildTools.FullName)"
}

$artifacts = @{
  debug = 'app/build/outputs/apk/debug/app-debug.apk'
  release = 'app/build/outputs/apk/release/Quantum L7 AI release 1.0.7.apk'
}

foreach ($entry in $artifacts.GetEnumerator() | Sort-Object Name) {
  if (-not (Test-Path $entry.Value)) {
    Write-Host "$($entry.Name): APK not built" -ForegroundColor Yellow
    continue
  }
  $digest = & $apksigner verify --print-certs $entry.Value |
    Select-String -Pattern 'SHA-256 digest:' |
    Select-Object -First 1
  Write-Host "$($entry.Name): $($digest.Line.Trim())"
}
