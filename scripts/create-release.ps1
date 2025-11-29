# Electron LibreMon Release Script
# Creates a GitHub release with built artifacts

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$false)]
    [string]$Notes = "",

    [Parameter(Mandatory=$false)]
    [switch]$Draft
)

Write-Host "Creating LibreMon release v$Version" -ForegroundColor Green

# Ensure we're on main branch and clean
$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Error "Must be on main branch. Current branch: $branch"
    exit 1
}

$status = git status --porcelain
if ($status) {
    Write-Error "Working directory is not clean. Please commit or stash changes."
    exit 1
}

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run make

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

# Find the generated installer
$installerPath = Get-ChildItem -Path "out\make\squirrel.windows\x64\*.exe" | Select-Object -First 1

if (-not $installerPath) {
    Write-Error "Could not find generated installer in out\make\squirrel.windows\x64\"
    exit 1
}

Write-Host "Found installer: $($installerPath.FullName)" -ForegroundColor Green

# Create release notes if not provided
if (-not $Notes) {
    $Notes = @"
# LibreMon v$Version

Desktop hardware monitoring widget for Windows using LibreHardwareMonitor.

## Changes
- See commit history for details

## Installation
Download and run the installer. Requires administrator privileges.
"@
}

# Create the GitHub release
Write-Host "Creating GitHub release..." -ForegroundColor Yellow

$ghArgs = @(
    "release", "create", "v$Version",
    "--title", "LibreMon v$Version",
    "--notes", $Notes,
    $installerPath.FullName
)

if ($Draft) {
    $ghArgs += "--draft"
}

& gh @ghArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create GitHub release"
    exit 1
}

Write-Host "Release v$Version created successfully!" -ForegroundColor Green