param(
  [Parameter(Mandatory = $true)][string]$PatchPath,
  [string]$ProjectRoot = ".",
  [switch]$VerifyOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Get-Sha256Bytes {
  param([byte[]]$Bytes)
  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    return ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-Sha256File {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return '' }
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-SafeProjectPath {
  param([string]$Root, [string]$RelativePath)
  $relative = ([string]$RelativePath).Replace('\', '/')
  if (-not $relative -or $relative -match '(^|/)\.\.(/|$)' -or [IO.Path]::IsPathRooted($relative)) {
    throw "unsafe_manifest_path:$relative"
  }
  $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar)
  $full = [IO.Path]::GetFullPath((Join-Path $rootFull $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)))
  $prefix = $rootFull + [IO.Path]::DirectorySeparatorChar
  if (-not $full.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "manifest_path_escape:$relative"
  }
  return $full
}

function Test-ScopedOperation {
  param([string]$RelativePath, [string]$Kind)
  $path = ([string]$RelativePath).Replace('\', '/')
  $prefixes = @(
    'lib/ql7-support/',
    'lib/composer-safety/',
    'lib/account-restrictions/',
    'scripts/ql7-support/',
    'components/composer-safety/',
    'app/api/dm/',
    'app/exchange/battle-chat/',
    'app/forum/features/dm/'
  )
  foreach ($prefix in $prefixes) {
    if ($path.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { return $true }
  }

  if ($path -match '^tests/(?:unit|integration|contracts|component|smoke)/(?:project/)?(?:ql7-support|composer-safety)(?:[-./]|$)') { return $true }
  if ($Kind -eq 'deleted' -and $path -match '^scripts/ql7-support-(?:final|god-mode|v[0-9])') { return $true }

  $exact = @(
    'package.json',
    'app/api/battlecoin/chat/messages/route.js',
    'app/api/forum/mutate/route.js',
    'components/Ql7SupportRuntimeBridge.jsx',
    'lib/adsCore.js',
    'lib/subscriptions.js',
    'lib/supportEmailTransport.js',
    'lib/mongo/account-deletion-primary.cjs'
  )
  return $exact -contains $path
}

$project = [IO.Path]::GetFullPath($ProjectRoot)
$patch = [IO.Path]::GetFullPath($PatchPath)
if (-not (Test-Path -LiteralPath $project -PathType Container)) { throw "project_root_missing:$project" }
if (-not (Test-Path -LiteralPath $patch -PathType Leaf)) { throw "patch_missing:$patch" }

$source = [IO.File]::ReadAllText($patch, [Text.Encoding]::UTF8)
$manifestMatch = [regex]::Match($source, "ManifestBase64\s*=\s*@'\s*([\s\S]*?)\s*'@", [Text.RegularExpressions.RegexOptions]::IgnoreCase)
$payloadMatch = [regex]::Match($source, "PayloadBase64\s*=\s*@'\s*([\s\S]*?)\s*'@", [Text.RegularExpressions.RegexOptions]::IgnoreCase)
if (-not $manifestMatch.Success) { throw 'patch_manifest_missing' }
if (-not $payloadMatch.Success) { throw 'patch_payload_missing' }

$manifestBytes = [Convert]::FromBase64String(($manifestMatch.Groups[1].Value -replace '\s', ''))
$manifest = [Text.Encoding]::UTF8.GetString($manifestBytes) | ConvertFrom-Json
if ([string]$manifest.schema -ne 'ql7.support.absolute-single-architecture-patch-manifest') {
  throw "unsupported_patch_schema:$($manifest.schema)"
}
if (-not $manifest.operations -or -not $manifest.payload.sha256) { throw 'patch_manifest_incomplete' }

$payloadBytes = [Convert]::FromBase64String(($payloadMatch.Groups[1].Value -replace '\s', ''))
$payloadHash = Get-Sha256Bytes -Bytes $payloadBytes
if ($payloadHash -ne ([string]$manifest.payload.sha256).ToLowerInvariant()) {
  throw "payload_hash_mismatch:$payloadHash"
}

$selected = @($manifest.operations | Where-Object {
  Test-ScopedOperation -RelativePath ([string]$_.path) -Kind ([string]$_.kind)
})
$excluded = @($manifest.operations | Where-Object {
  -not (Test-ScopedOperation -RelativePath ([string]$_.path) -Kind ([string]$_.kind))
})
if (-not $selected.Count) { throw 'scoped_operation_set_empty' }

Add-Type -AssemblyName System.IO.Compression
$stream = [IO.MemoryStream]::new($payloadBytes, $false)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Read, $false)
$entries = @{}
foreach ($entry in $archive.Entries) {
  $entryPath = ([string]$entry.FullName).Replace('\', '/')
  if ($entryPath -and -not $entryPath.EndsWith('/')) { $entries[$entryPath] = $entry }
}

$alreadyApplied = New-Object System.Collections.Generic.List[object]
$toApply = New-Object System.Collections.Generic.List[object]
foreach ($operation in $selected) {
  $relative = ([string]$operation.path).Replace('\', '/')
  $kind = [string]$operation.kind
  $target = Get-SafeProjectPath -Root $project -RelativePath $relative
  $exists = Test-Path -LiteralPath $target -PathType Leaf
  $currentHash = if ($exists) { Get-Sha256File -Path $target } else { '' }
  $preHash = ([string]$operation.preSha256).ToLowerInvariant()
  $postHash = ([string]$operation.postSha256).ToLowerInvariant()

  if ($kind -eq 'deleted' -and -not $exists) {
    $alreadyApplied.Add([pscustomobject]@{ path = $relative; kind = $kind; state = 'post' })
    continue
  }
  if ($kind -ne 'deleted' -and $currentHash -and $currentHash -eq $postHash) {
    $alreadyApplied.Add([pscustomobject]@{ path = $relative; kind = $kind; state = 'post' })
    continue
  }
  if ($kind -eq 'new') {
    if ($exists) { throw "new_path_preimage_exists:$relative" }
  } elseif (-not $exists) {
    throw "required_preimage_missing:$relative"
  } elseif ($currentHash -ne $preHash) {
    throw "preimage_hash_mismatch:${relative}:${currentHash}:${preHash}"
  }

  if ($kind -ne 'deleted') {
    if (-not $entries.ContainsKey($relative)) { throw "payload_entry_missing:$relative" }
    $entry = $entries[$relative]
    $entryStream = $entry.Open()
    try {
      $buffer = [IO.MemoryStream]::new()
      try {
        $entryStream.CopyTo($buffer)
        $bytes = $buffer.ToArray()
      } finally {
        $buffer.Dispose()
      }
    } finally {
      $entryStream.Dispose()
    }
    $entryHash = Get-Sha256Bytes -Bytes $bytes
    if ($entryHash -ne $postHash) { throw "payload_entry_hash_mismatch:${relative}:${entryHash}:${postHash}" }
  }
  $toApply.Add([pscustomobject]@{ operation = $operation; target = $target })
}

$preview = [ordered]@{
  schema = 'ql7.support.scoped-closure-application'
  schemaVersion = '1'
  artifactId = [string]$manifest.artifactId
  verifyOnly = [bool]$VerifyOnly
  selectedOperationCount = $selected.Count
  pendingOperationCount = $toApply.Count
  alreadyAppliedCount = $alreadyApplied.Count
  excludedOperationCount = $excluded.Count
  excludedPaths = @($excluded | ForEach-Object { [string]$_.path })
  protectedGlobalExamples = @($excluded | Where-Object { [string]$_.path -match '^(?:app/(?!api/dm/)|components/|lib/(?!ql7-support/|composer-safety/|account-restrictions/)|tools/)' } | Select-Object -First 80 | ForEach-Object { [string]$_.path })
  payloadSha256 = $payloadHash
}

if ($VerifyOnly) {
  $archive.Dispose()
  $stream.Dispose()
  $preview | ConvertTo-Json -Depth 8
  exit 0
}

$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$work = Join-Path ([IO.Path]::GetTempPath()) ("ql7-scoped-closure-" + [Guid]::NewGuid().ToString('N'))
$workFull = [IO.Path]::GetFullPath($work)
if (-not $workFull.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) { throw 'unsafe_work_path' }
$backupRoot = Join-Path $workFull 'backup'
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$applied = New-Object System.Collections.Generic.List[object]
try {
  foreach ($row in $toApply) {
    $operation = $row.operation
    $relative = ([string]$operation.path).Replace('\', '/')
    $kind = [string]$operation.kind
    $target = [string]$row.target
    if (Test-Path -LiteralPath $target -PathType Leaf) {
      $backup = Get-SafeProjectPath -Root $backupRoot -RelativePath $relative
      $backupDir = Split-Path -Parent $backup
      if (-not (Test-Path -LiteralPath $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
      [IO.File]::Copy($target, $backup, $true)
    }

    if ($kind -eq 'deleted') {
      [IO.File]::Delete($target)
    } else {
      $entry = $entries[$relative]
      $entryStream = $entry.Open()
      try {
        $buffer = [IO.MemoryStream]::new()
        try {
          $entryStream.CopyTo($buffer)
          $bytes = $buffer.ToArray()
        } finally {
          $buffer.Dispose()
        }
      } finally {
        $entryStream.Dispose()
      }
      $targetDir = Split-Path -Parent $target
      if (-not (Test-Path -LiteralPath $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
      [IO.File]::WriteAllBytes($target, $bytes)
    }
    $applied.Add([pscustomobject]@{ path = $relative; kind = $kind })
  }

  foreach ($operation in $selected) {
    $relative = ([string]$operation.path).Replace('\', '/')
    $target = Get-SafeProjectPath -Root $project -RelativePath $relative
    if ([string]$operation.kind -eq 'deleted') {
      if (Test-Path -LiteralPath $target) { throw "postimage_delete_failed:$relative" }
    } else {
      $actual = Get-Sha256File -Path $target
      $expected = ([string]$operation.postSha256).ToLowerInvariant()
      if ($actual -ne $expected) { throw "postimage_hash_mismatch:${relative}:${actual}:${expected}" }
    }
  }
} catch {
  for ($index = $applied.Count - 1; $index -ge 0; $index--) {
    $row = $applied[$index]
    $relative = [string]$row.path
    $target = Get-SafeProjectPath -Root $project -RelativePath $relative
    $backup = Get-SafeProjectPath -Root $backupRoot -RelativePath $relative
    if (Test-Path -LiteralPath $backup -PathType Leaf) {
      $targetDir = Split-Path -Parent $target
      if (-not (Test-Path -LiteralPath $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
      [IO.File]::Copy($backup, $target, $true)
    } elseif (Test-Path -LiteralPath $target -PathType Leaf) {
      [IO.File]::Delete($target)
    }
  }
  throw
} finally {
  $archive.Dispose()
  $stream.Dispose()
}

$report = [ordered]@{
  schema = $preview.schema
  schemaVersion = $preview.schemaVersion
  artifactId = $preview.artifactId
  appliedAt = [DateTime]::UtcNow.ToString('o')
  status = 'APPLIED_SCOPED_POSTIMAGE'
  selectedOperationCount = $selected.Count
  appliedOperationCount = $applied.Count
  alreadyAppliedCount = $alreadyApplied.Count
  excludedOperationCount = $excluded.Count
  excludedPaths = $preview.excludedPaths
  protectedGlobalExamples = $preview.protectedGlobalExamples
  payloadSha256 = $payloadHash
}
$reportsDir = Join-Path $project 'reports'
if (-not (Test-Path -LiteralPath $reportsDir)) { New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null }
$reportPath = Join-Path $reportsDir 'ql7-support-scoped-closure-application.json'
[IO.File]::WriteAllText($reportPath, (($report | ConvertTo-Json -Depth 8) + "`n"), [Text.UTF8Encoding]::new($false))

if ($workFull.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $workFull)) {
  Remove-Item -LiteralPath $workFull -Recurse -Force
}
$report | ConvertTo-Json -Depth 8
