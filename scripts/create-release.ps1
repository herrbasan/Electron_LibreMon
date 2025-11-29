# Electron LibreMon Release Script
# Creates a GitHub release with built artifacts

param(
    [Parameter(Mandatory=$false)]
    [string]$Notes = "",

    [Parameter(Mandatory=$false)]
    [switch]$Draft
)

# Read version from package.json
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$Version = $packageJson.version

Write-Host "Creating LibreMon release v$Version" -ForegroundColor Green

# Check if GitHub CLI is installed
$ghPath = $null
try {
    $ghCmd = Get-Command gh -ErrorAction Stop
    $ghPath = $ghCmd.Source
} catch {
    # Try to find gh.exe in common locations
    $possiblePaths = @(
        "C:\Program Files\GitHub CLI\gh.exe",
        "C:\Program Files\GitHub CLI\bin\gh.exe",
        "$env:USERPROFILE\AppData\Local\Microsoft\WinGet\Packages\GitHub.cli_*\x64\gh.exe",
        "$env:USERPROFILE\AppData\Local\Microsoft\WinGet\Links\gh.exe",
        "C:\ProgramData\chocolatey\bin\gh.exe",
        "C:\tools\gh\gh.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $ghPath = $path
            break
        }
    }
    
    if (-not $ghPath) {
        Write-Error @"
GitHub CLI (gh) is not found in PATH or common installation locations.

Installation options:
1. Winget: winget install --id GitHub.cli
2. Chocolatey: choco install gh
3. Download: https://cli.github.com/

After installation, ensure it's in your PATH or run this script from the directory containing gh.exe
"@
        exit 1
    }
}

Write-Host "Using GitHub CLI at: $ghPath" -ForegroundColor Cyan

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

# Find generated artifacts
$installerPath = Get-ChildItem -Path "out\make\squirrel.windows\x64\*.exe" | Select-Object -First 1
$nupkgPath = Get-ChildItem -Path "out\make\squirrel.windows\x64\*-full.nupkg" | Select-Object -First 1
$releasesPath = Get-Item -Path "out\make\squirrel.windows\x64\RELEASES"

if (-not $installerPath) {
    Write-Error "Could not find generated installer in out\make\squirrel.windows\x64\"
    exit 1
}

Write-Host "Found installer: $($installerPath.FullName)" -ForegroundColor Green
Write-Host "Found nupkg: $($nupkgPath.FullName)" -ForegroundColor Green
Write-Host "Found RELEASES: $($releasesPath.FullName)" -ForegroundColor Green

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
    $installerPath.FullName,
    $nupkgPath.FullName,
    $releasesPath.FullName
)

if ($Draft) {
    $ghArgs += "--draft"
}

& $ghPath @ghArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create GitHub release"
    exit 1
}

Write-Host "Release v$Version created successfully!" -ForegroundColor Green