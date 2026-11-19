param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [Parameter(Mandatory = $true)]
  [string]$SignedMsiPath,

  [string]$Notes = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SignedMsiPath)) {
  throw "Signed MSI not found at: $SignedMsiPath"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$tag = "v$Version"
$targetName = "Markora-MD_$Version.msi"
$releaseDir = Join-Path "docs/releases" $Version
$targetPath = Join-Path $releaseDir $targetName
$manifestPath = "docs/releases.json"
$latestPath = "docs/latest.json"
$downloadUrl = "https://kelvink96.github.io/markora/releases/$Version/$targetName"

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
Copy-Item -LiteralPath $SignedMsiPath -Destination $targetPath -Force

$signature = Get-AuthenticodeSignature $targetPath
$signature | Format-List Status, StatusMessage, SignerCertificate

if ($signature.Status -ne "Valid") {
  throw "Signed MSI validation failed: $($signature.Status)"
}

# Sign for the in-app updater and write docs/latest.json. This runs before any
# git or GitHub step so a failure cannot leave a half-published release.
if (-not $env:TAURI_SIGNING_PRIVATE_KEY) {
  throw "TAURI_SIGNING_PRIVATE_KEY is not set"
}
if (-not $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD) {
  throw "TAURI_SIGNING_PRIVATE_KEY_PASSWORD is not set"
}

npx tauri signer sign $targetPath
if ($LASTEXITCODE -ne 0) {
  throw "tauri signer sign failed with exit code $LASTEXITCODE"
}

$sigPath = "$targetPath.sig"
if (-not (Test-Path $sigPath)) {
  throw "Updater signature not found at: $sigPath"
}

node scripts/build-update-manifest.mjs --version $Version --url $downloadUrl --signature-file $sigPath "--notes=$Notes" --out $latestPath
if ($LASTEXITCODE -ne 0) {
  throw "build-update-manifest failed with exit code $LASTEXITCODE"
}

if (Test-Path $manifestPath) {
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
} else {
  $manifest = @()
}

$manifest = @($manifest | Where-Object { $_.version -ne $Version })
$manifest += [pscustomobject]@{
  version = $Version
  tag = $tag
  filename = $targetName
  url = $downloadUrl
  publishedAt = (Get-Date).ToUniversalTime().ToString("o")
  current = $true
}

$manifest = $manifest |
  Sort-Object { [version]$_.version } -Descending |
  ForEach-Object -Begin { $first = $true } -Process {
    $_.current = $first
    $first = $false
    $_
  }

$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath

git add $releaseDir $manifestPath $latestPath
git commit -m "chore: publish msi for $Version"
git push origin main

gh release upload $tag $targetPath --clobber

Write-Host "Published signed release for $Version"
Write-Host "Direct download URL: $downloadUrl"
