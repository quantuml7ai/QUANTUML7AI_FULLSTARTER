param(
  [string]$AndroidRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Set-Location $AndroidRoot

if (-not $env:GRADLE_USER_HOME) {
  $gradleUserHome = Join-Path $AndroidRoot '.gradle-user-home'
  New-Item -ItemType Directory -Force -Path $gradleUserHome | Out-Null
  $env:GRADLE_USER_HOME = $gradleUserHome
  Write-Host "Using local Gradle user home: $gradleUserHome" -ForegroundColor Cyan
}

if (-not $env:ANDROID_USER_HOME) {
  $androidUserHome = Join-Path $AndroidRoot '.android-user-home'
  New-Item -ItemType Directory -Force -Path $androidUserHome | Out-Null
  $env:ANDROID_USER_HOME = $androidUserHome
  Write-Host "Using local Android user home: $androidUserHome" -ForegroundColor Cyan
}

function Use-AndroidStudioJavaIfNeeded {
  if ($env:JAVA_HOME) {
    $javaFromHome = Join-Path $env:JAVA_HOME 'bin\java.exe'
    if (Test-Path $javaFromHome) { return }
  }

  if (Get-Command java -ErrorAction SilentlyContinue) { return }

  $candidates = @(
    'C:\Program Files\Android\Android Studio\jbr',
    'C:\Program Files\Android\Android Studio\jre'
  )

  foreach ($candidate in $candidates) {
    $javaExe = Join-Path $candidate 'bin\java.exe'
    if (Test-Path $javaExe) {
      $env:JAVA_HOME = $candidate
      $env:Path = "$(Join-Path $candidate 'bin');$env:Path"
      Write-Host "Using Android Studio Java: $javaExe" -ForegroundColor Cyan
      return
    }
  }
}

Use-AndroidStudioJavaIfNeeded

$gradlew = Join-Path $AndroidRoot 'gradlew.bat'
if (Test-Path $gradlew) {
  $runner = $gradlew
} else {
  $gradleCommand = Get-Command gradle -ErrorAction SilentlyContinue
  if (-not $gradleCommand) {
    throw 'Gradle was not found. Open mobile/android in Android Studio or generate Gradle Wrapper as described in GRADLE_WRAPPER.md.'
  }
  $runner = $gradleCommand.Source
}

$firebaseDebugConfigured =
  (Test-Path (Join-Path $AndroidRoot 'app/google-services.json')) -or
  (Test-Path (Join-Path $AndroidRoot 'app/src/debug/google-services.json'))
if (-not $firebaseDebugConfigured) {
  Write-Warning 'Debug google-services.json is absent. Debug APK will keep Web Push, but native FCM will be disabled.'
}

Write-Host "Building Quantum L7 AI debug APK with $runner" -ForegroundColor Cyan
& $runner ':app:assembleDebug'
if ($LASTEXITCODE -ne 0) {
  throw "Gradle assembleDebug failed with exit code $LASTEXITCODE. Check JDK/JAVA_HOME, Android SDK and Gradle output above."
}

$apkPath = Join-Path $AndroidRoot 'app/build/outputs/apk/debug/app-debug.apk'
if (-not (Test-Path $apkPath)) {
  throw "Debug APK was not produced at $apkPath"
}

$item = Get-Item $apkPath
Write-Host ''
Write-Host 'Debug APK ready:' -ForegroundColor Green
Write-Host $item.FullName
Write-Host ("Size: {0:N2} MB" -f ($item.Length / 1MB))
