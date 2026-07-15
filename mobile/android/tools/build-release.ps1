param(
  [string]$AndroidRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Set-Location $AndroidRoot

if (-not $env:GRADLE_USER_HOME) {
  $env:GRADLE_USER_HOME = Join-Path $AndroidRoot '.gradle-user-home'
  New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null
}

if (-not $env:ANDROID_USER_HOME) {
  $env:ANDROID_USER_HOME = Join-Path $AndroidRoot '.android-user-home'
  New-Item -ItemType Directory -Force -Path $env:ANDROID_USER_HOME | Out-Null
}

if (-not $env:JAVA_HOME) {
  $androidStudioJbr = 'C:\Program Files\Android\Android Studio\jbr'
  if (Test-Path (Join-Path $androidStudioJbr 'bin\java.exe')) {
    $env:JAVA_HOME = $androidStudioJbr
  }
}

$keystoreProperties = Join-Path $AndroidRoot 'keystore.properties'
if (-not (Test-Path $keystoreProperties)) {
  throw "Missing $keystoreProperties. Create the ignored release signing config first."
}

$runner = Join-Path $AndroidRoot 'gradlew.bat'
if (-not (Test-Path $runner)) {
  throw "Gradle Wrapper was not found at $runner"
}

$firebaseReleaseConfigured =
  (Test-Path (Join-Path $AndroidRoot 'app/google-services.json')) -or
  (Test-Path (Join-Path $AndroidRoot 'app/src/release/google-services.json'))
if (-not $firebaseReleaseConfigured) {
  Write-Warning 'Release google-services.json is absent. This APK/AAB will keep Web Push, but native FCM will be disabled.'
}

Write-Host "Building signed Quantum L7 AI release APK and AAB..." -ForegroundColor Cyan
& $runner ':app:assembleRelease' ':app:bundleRelease'
if ($LASTEXITCODE -ne 0) {
  throw "Gradle release build failed with exit code $LASTEXITCODE."
}

$canonicalApk = Join-Path $AndroidRoot 'app/build/outputs/apk/release/app-release.apk'
$namedApk = Join-Path $AndroidRoot 'app/build/outputs/apk/release/Quantum L7 AI release 1.0.7.apk'
$releaseMetadata = Join-Path $AndroidRoot 'app/build/outputs/apk/release/output-metadata.json'
$canonicalAab = Join-Path $AndroidRoot 'app/build/outputs/bundle/release/app-release.aab'
$namedAab = Join-Path $AndroidRoot 'app/build/outputs/bundle/release/Quantum L7 AI release 1.0.7.aab'

if (-not (Test-Path $canonicalApk)) {
  throw "Release APK was not produced at $canonicalApk"
}
if (-not (Test-Path $canonicalAab)) {
  throw "Release AAB was not produced at $canonicalAab"
}

Move-Item -LiteralPath $canonicalApk -Destination $namedApk -Force
Move-Item -LiteralPath $canonicalAab -Destination $namedAab -Force

if (Test-Path $releaseMetadata) {
  $metadata = Get-Content -LiteralPath $releaseMetadata -Raw | ConvertFrom-Json
  foreach ($element in $metadata.elements) {
    if ($element.outputFile -eq 'app-release.apk') {
      $element.outputFile = 'Quantum L7 AI release 1.0.7.apk'
    }
  }
  $metadata | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $releaseMetadata -Encoding UTF8
}

$namedItem = Get-Item -LiteralPath $namedApk
$aabItem = Get-Item -LiteralPath $namedAab
Write-Host ("Release APK: {0} ({1:N2} MB)" -f $namedItem.FullName, ($namedItem.Length / 1MB)) -ForegroundColor Green
Write-Host ("Release AAB: {0} ({1:N2} MB)" -f $aabItem.FullName, ($aabItem.Length / 1MB)) -ForegroundColor Green
