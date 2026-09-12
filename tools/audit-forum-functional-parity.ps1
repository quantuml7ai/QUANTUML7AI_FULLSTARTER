[CmdletBinding()]
param(
  [string]$ZipPath = "",
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$OutputPath = "audit/forum-functional-parity.report.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-Sha256HexFromBytes {
  param([byte[]]$Bytes)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $sha.ComputeHash($Bytes)
    return -join ($hash | ForEach-Object { $_.ToString("x2") })
  } finally {
    $sha.Dispose()
  }
}

function Get-Sha256HexFromFile {
  param([string]$LiteralPath)
  if (-not (Test-Path -LiteralPath $LiteralPath)) { return $null }
  return (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Read-ZipEntryText {
  param([System.IO.Compression.ZipArchiveEntry]$Entry)
  if (-not $Entry) { return "" }
  $stream = $Entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  try { return $reader.ReadToEnd() } finally {
    $reader.Dispose()
    $stream.Dispose()
  }
}

function Read-ZipEntryBytes {
  param([System.IO.Compression.ZipArchiveEntry]$Entry)
  if (-not $Entry) { return [byte[]]@() }
  $stream = $Entry.Open()
  try {
    $ms = New-Object System.IO.MemoryStream
    try {
      $stream.CopyTo($ms)
      return $ms.ToArray()
    } finally {
      $ms.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

function Read-TextSafe {
  param([string]$LiteralPath)
  if (Test-Path -LiteralPath $LiteralPath) { return (Get-Content -LiteralPath $LiteralPath -Raw) }
  return ""
}

function Unique-RegexMatches {
  param(
    [string]$Text,
    [regex]$Regex
  )
  return @($Regex.Matches($Text) | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ } | Sort-Object -Unique)
}

function Set-Diff {
  param(
    [string[]]$Baseline,
    [string[]]$Current
  )
  [pscustomobject]@{
    baseline_only = @($Baseline | Where-Object { $_ -notin $Current })
    current_only  = @($Current  | Where-Object { $_ -notin $Baseline })
  }
}

if (-not $ZipPath) {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $candidate = Get-ChildItem -LiteralPath $desktop -Filter "*.zip" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
  if ($candidate) { $ZipPath = $candidate }
}

if (-not (Test-Path -LiteralPath $ZipPath)) {
  throw "Baseline zip not found: $ZipPath"
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
  if ($zip.Entries.Count -eq 0) { throw "Zip has no entries: $ZipPath" }

  $firstEntry = $zip.Entries | Select-Object -First 1
  $prefix = ($firstEntry.FullName -split "/")[0]
  if (-not $prefix) { throw "Cannot detect root prefix in zip: $ZipPath" }

  $scopeEntries = @(
    $zip.Entries | Where-Object {
      if ([string]::IsNullOrEmpty($_.Name)) { return $false }
      $full = $_.FullName.Replace("\", "/")
      if ($full -notlike "$prefix/*") { return $false }
      $rel = $full.Substring($prefix.Length + 1)
      return (
        $rel -like "app/api/*" -or
        $rel -eq "app/forum/Forum.jsx" -or
        $rel -eq "app/forum/p/[postId]/route.js"
      )
    }
  )

  $hashRows = @()
  foreach ($entry in ($scopeEntries | Sort-Object FullName)) {
    $full = $entry.FullName.Replace("\", "/")
    $rel = $full.Substring($prefix.Length + 1)
    $curFile = Join-Path $ProjectRoot ($rel.Replace("/", "\"))
    $baseHash = Get-Sha256HexFromBytes -Bytes (Read-ZipEntryBytes -Entry $entry)
    $curHash = Get-Sha256HexFromFile -LiteralPath $curFile
    $status = if (-not $curHash) { "missing_current" } elseif ($baseHash -eq $curHash) { "same" } else { "changed" }
    $hashRows += [pscustomobject]@{
      file = $rel
      status = $status
      baseline_sha256 = $baseHash
      current_sha256 = $curHash
    }
  }

  $baselineForumEntry = $zip.Entries | Where-Object {
    $_.FullName.Replace("\", "/") -eq "$prefix/app/forum/Forum.jsx"
  } | Select-Object -First 1

  if (-not $baselineForumEntry) {
    throw "Baseline file not found in zip: app/forum/Forum.jsx"
  }

  $baselineForumText = Read-ZipEntryText -Entry $baselineForumEntry

  $currentForumFiles = Get-ChildItem -LiteralPath (Join-Path $ProjectRoot "app/forum") -Recurse -File -Include *.js,*.jsx |
    Select-Object -ExpandProperty FullName
  $currentForumText = ($currentForumFiles | ForEach-Object { Read-TextSafe -LiteralPath $_ }) -join "`n"
  $currentForumJsText = Read-TextSafe -LiteralPath (Join-Path $ProjectRoot "app/forum/Forum.jsx")

  $rxFetch = [regex]::new('fetch\(\s*["'']([^"'']+)["'']')
  $rxApiLiteral = [regex]::new('(/api/[A-Za-z0-9_\-/\?\.\[\]=]+)')
  $rxLocalStorage = [regex]::new('(?:localStorage\.(?:getItem|setItem|removeItem)|safeLocalStorage(?:Get|Set))\(\s*["'']([^"'']+)["'']')
  $rxEvents = [regex]::new('new\s+(?:CustomEvent|Event)\(\s*["'']([^"'']+)["'']')

  $baselineFetch = Unique-RegexMatches -Text $baselineForumText -Regex $rxFetch
  $currentFetch = Unique-RegexMatches -Text $currentForumText -Regex $rxFetch

  $baselineApi = Unique-RegexMatches -Text $baselineForumText -Regex $rxApiLiteral
  $currentApi = Unique-RegexMatches -Text $currentForumText -Regex $rxApiLiteral

  $baselineStorage = Unique-RegexMatches -Text $baselineForumText -Regex $rxLocalStorage
  $currentStorage = Unique-RegexMatches -Text $currentForumText -Regex $rxLocalStorage

  $baselineEvents = Unique-RegexMatches -Text $baselineForumText -Regex $rxEvents
  $currentEvents = Unique-RegexMatches -Text $currentForumText -Regex $rxEvents

  $changedFiles = @($hashRows | Where-Object { $_.status -eq "changed" } | Select-Object -ExpandProperty file)
  $missingFiles = @($hashRows | Where-Object { $_.status -eq "missing_current" } | Select-Object -ExpandProperty file)
  $unexpectedChanged = @($changedFiles | Where-Object { $_ -ne "app/forum/Forum.jsx" })
  $baselineOnlyApiLiterals = @($baselineApi | Where-Object { $_ -notin $currentApi })
  $baselineOnlyMissingRoutes = @()
  foreach ($apiLiteral in $baselineOnlyApiLiterals) {
    $cleanApi = ($apiLiteral -split "\?")[0]
    $routeRel = ("app/" + $cleanApi.TrimStart("/") + "/route.js")
    $routePath = Join-Path $ProjectRoot ($routeRel.Replace("/", "\"))
    if (-not (Test-Path -LiteralPath $routePath)) {
      $baselineOnlyMissingRoutes += $apiLiteral
    }
  }

  $parityStatus = "passed"
  if ($missingFiles.Count -gt 0 -or $unexpectedChanged.Count -gt 0) {
    $parityStatus = "failed"
  } elseif ($baselineOnlyMissingRoutes.Count -gt 0) {
    $parityStatus = "warning"
  }

  $detectedRisks = @()
  if ($missingFiles.Count -gt 0) {
    $detectedRisks += "Missing files compared to baseline: $($missingFiles -join ', ')"
  }
  if ($unexpectedChanged.Count -gt 0) {
    $detectedRisks += "Unexpected changed files: $($unexpectedChanged -join ', ')"
  }
  if ($parityStatus -eq "warning") {
    $detectedRisks += "Some baseline API literals are missing from current forum source scan and route map."
  }

  $report = [pscustomobject]@{
    phase = "12-final-functional-parity"
    timestamp = (Get-Date).ToString("o")
    scope = @("app/forum", "app/api")
    baseline_zip = $ZipPath
    project_root = $ProjectRoot
    touched_files = @("tools/audit-forum-functional-parity.ps1", $OutputPath.Replace("\", "/"))
    new_files = @()
    moved_logic_domains = @("n/a (verification-only)")
    dependency_changes = [pscustomobject]@{
      hash_total = $hashRows.Count
      hash_same = @($hashRows | Where-Object { $_.status -eq "same" }).Count
      hash_changed = $changedFiles.Count
      hash_missing = $missingFiles.Count
      unexpected_changed = $unexpectedChanged
    }
    detected_risks = $detectedRisks
    detected_cycles = @()
    api_contract_risk = if ($parityStatus -eq "passed") { "low" } elseif ($parityStatus -eq "warning") { "medium" } else { "high" }
    storage_risk = "low"
    runtime_risk = "medium"
    notes = @(
      "Static parity audit compares baseline monolith surface with current modular forum scope.",
      "Changed file app/forum/Forum.jsx is expected because it became a thin composition wrapper.",
      "Use this report together with build/audit scripts for release confidence."
    )
    status = $parityStatus
    hash_rows = $hashRows
    forum_surface = [pscustomobject]@{
      fetch_literals = [pscustomobject]@{
        baseline_count = $baselineFetch.Count
        current_count = $currentFetch.Count
        diff = Set-Diff -Baseline $baselineFetch -Current $currentFetch
      }
      api_literals = [pscustomobject]@{
        baseline_count = $baselineApi.Count
        current_count = $currentApi.Count
        diff = Set-Diff -Baseline $baselineApi -Current $currentApi
        baseline_only_missing_routes = $baselineOnlyMissingRoutes
      }
      storage_keys = [pscustomobject]@{
        baseline_count = $baselineStorage.Count
        current_count = $currentStorage.Count
        diff = Set-Diff -Baseline $baselineStorage -Current $currentStorage
      }
      event_names = [pscustomobject]@{
        baseline_count = $baselineEvents.Count
        current_count = $currentEvents.Count
        diff = Set-Diff -Baseline $baselineEvents -Current $currentEvents
      }
    }
    thin_wrapper_check = [pscustomobject]@{
      forum_js_lines = @($currentForumJsText -split "`n").Count
      has_forumroot_import = $currentForumJsText.Contains("ForumRoot")
      renders_forumroot = $currentForumJsText.Contains("<ForumRoot />")
    }
  }

  $outAbs = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $ProjectRoot $OutputPath }
  $outDir = Split-Path -Parent $outAbs
  if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }

  $json = $report | ConvertTo-Json -Depth 20
  Set-Content -LiteralPath $outAbs -Value $json -Encoding UTF8
  Write-Output $json
}
finally {
  $zip.Dispose()
}
