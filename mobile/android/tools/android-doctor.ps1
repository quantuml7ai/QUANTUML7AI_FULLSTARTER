param(
  [string]$AndroidRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Write-Check {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Details = ''
  )
  $mark = if ($Ok) { '[OK]' } else { '[MISS]' }
  $line = "$mark $Name"
  if ($Details) { $line = "$line - $Details" }
  if ($Ok) { Write-Host $line -ForegroundColor Green } else { Write-Host $line -ForegroundColor Yellow }
}

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

function Find-AndroidStudioJava {
  $candidates = @(
    'C:\Program Files\Android\Android Studio\jbr\bin\java.exe',
    'C:\Program Files\Android\Android Studio\jre\bin\java.exe'
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }

  return $null
}

function Test-EnvKey {
  param(
    [string]$Path,
    [string]$Name
  )
  if (-not (Test-Path $Path)) { return $false }
  return [bool](Get-Content -LiteralPath $Path | Where-Object { $_ -match "^\s*$([regex]::Escape($Name))\s*=\s*.+$" } | Select-Object -First 1)
}

Set-Location $AndroidRoot

$java = Get-Command java -ErrorAction SilentlyContinue
$javaFallback = Find-AndroidStudioJava
$gradle = Get-Command gradle -ErrorAction SilentlyContinue
$gradlew = Test-Path (Join-Path $AndroidRoot 'gradlew.bat')
$adb = Get-Command adb -ErrorAction SilentlyContinue
$localProps = Test-Path (Join-Path $AndroidRoot 'local.properties')
$sdkEnv = $env:ANDROID_HOME
if (-not $sdkEnv) { $sdkEnv = $env:ANDROID_SDK_ROOT }
$sdkDir = if ($sdkEnv) { $sdkEnv } else { Read-AndroidSdkDir -Root $AndroidRoot }
$adbFallback = if ($sdkDir) { Join-Path $sdkDir 'platform-tools\adb.exe' } else { $null }
$adbAvailable = ($null -ne $adb) -or ($adbFallback -and (Test-Path $adbFallback))
$javaAvailable = ($null -ne $java) -or ($javaFallback -and (Test-Path $javaFallback))
$projectEnv = Join-Path (Resolve-Path (Join-Path $AndroidRoot '..\..')).Path '.env.local'
$firebaseRoot = Test-Path (Join-Path $AndroidRoot 'app\google-services.json')
$firebaseRelease = Test-Path (Join-Path $AndroidRoot 'app\src\release\google-services.json')
$firebaseDebug = Test-Path (Join-Path $AndroidRoot 'app\src\debug\google-services.json')
$fcmServerConfigured = (Test-EnvKey $projectEnv 'FCM_PROJECT_ID') -and
  (Test-EnvKey $projectEnv 'FCM_CLIENT_EMAIL') -and
  (Test-EnvKey $projectEnv 'FCM_PRIVATE_KEY')

Write-Host ''
Write-Host 'Quantum L7 AI Android Doctor' -ForegroundColor Cyan
Write-Host '--------------------------------' -ForegroundColor DarkCyan
Write-Check 'Android project root' (Test-Path (Join-Path $AndroidRoot 'settings.gradle.kts')) $AndroidRoot
Write-Check 'Java command' $javaAvailable $(if ($java) { $java.Source } elseif ($javaFallback) { "Android Studio JBR found: $javaFallback" } else { 'Install JDK 17+' })
Write-Check 'Gradle command' ($null -ne $gradle) $(if ($gradle) { $gradle.Source } else { 'Use Android Studio or generate Gradle Wrapper' })
Write-Check 'Gradle Wrapper' $gradlew $(if ($gradlew) { 'gradlew.bat found' } else { 'Optional, see GRADLE_WRAPPER.md' })
Write-Check 'Android SDK' ([bool]$sdkDir) $(if ($sdkDir) { $sdkDir } else { 'Set ANDROID_HOME / ANDROID_SDK_ROOT or local.properties' })
Write-Check 'local.properties' $localProps $(if ($localProps) { 'present' } else { 'copy local.properties.example if needed' })
Write-Check 'adb command' $adbAvailable $(if ($adb) { $adb.Source } elseif ($adbFallback) { $adbFallback } else { 'Needed for LDPlayer install from terminal' })
Write-Check 'Gradle user home' $true $(if ($env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME } else { Join-Path $AndroidRoot '.gradle-user-home' })
Write-Check 'Firebase release config' ($firebaseRoot -or $firebaseRelease) $(if ($firebaseRoot) { 'app/google-services.json' } elseif ($firebaseRelease) { 'app/src/release/google-services.json' } else { 'Native release FCM is disabled until google-services.json is added' })
Write-Check 'Firebase debug config' ($firebaseRoot -or $firebaseDebug) $(if ($firebaseRoot) { 'app/google-services.json' } elseif ($firebaseDebug) { 'app/src/debug/google-services.json' } else { 'Optional: needed only for native FCM in debug package' })
Write-Check 'Local FCM server env' $fcmServerConfigured $(if ($fcmServerConfigured) { '.env.local contains all server-only FCM fields' } else { 'Set FCM_PROJECT_ID, FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY locally/Vercel' })
Write-Check 'Debug APK output folder' (Test-Path 'app/build/outputs/apk') 'created after assembleDebug'
Write-Host ''
Write-Host 'If Gradle is missing, open mobile/android in Android Studio and build Debug APK there.' -ForegroundColor Gray
