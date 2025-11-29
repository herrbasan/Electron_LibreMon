# Electron LibreMon

Desktop hardware monitoring widget for Windows using LibreHardwareMonitor.

## Features

- **Real-time Hardware Monitoring**: CPU, GPU, RAM, storage, network, motherboard sensors
- **Desktop Widget**: Transparent, frameless overlay with live hardware stats and graphs
- **Settings Window**: Detailed sensor information and configuration
- **Sensor Group Configuration**: Enable/disable hardware categories (CPU, GPU, Memory, etc.)
- **System Tray Integration**: Quick access to widget and settings
- **Centralized Reporting**: Optional data transmission to backend server for multi-machine monitoring

## Requirements

- Windows 10/11
- Administrator privileges (required for hardware sensor access)
- No external dependencies - .NET 9.0 runtime bundled with addon

## Installation

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/herrbasan/Electron_LibreMon.git
cd Electron_LibreMon

# Install dependencies
npm install

# Run
npm start

# Package
npm run package
```

## Configuration

Settings are stored in `config.json` and editable via the settings UI:

- **Ingest Server**: Backend endpoint for centralized data collection
- **Poll Rate**: Data polling interval (default: 1000ms)
- **Sensor Groups**: Hardware categories to monitor
- **Sensor Selection**: Individual sensors to display/report
- **Start at Login**: Launch at Windows startup

## Architecture

- **Electron** desktop application with system tray
- **N-API Native Addon** for direct LibreHardwareMonitor integration
- **Custom NUI Framework** for lightweight UI components
- **Performance-first**: <200MB memory, ~400ms poll time

## Development

VS Code must run as Administrator for hardware sensor access.

The N-API addon is built from the `LibreHardwareMonitor_NativeNodeIntegration` submodule and includes a self-contained .NET 9.0 runtime.

## Releases

Create a new GitHub release with built artifacts:

```bash
# Install GitHub CLI first (required)
winget install --id GitHub.cli
# or
choco install gh

# Authenticate (use full path if not in PATH)
"C:\Program Files\GitHub CLI\gh.exe" auth login
# or if installed elsewhere
gh auth login

# Create a release
npm run release -- -Version 1.2.0 -Notes "Release notes here"

# Or use PowerShell directly
.\scripts\create-release.ps1 -Version 1.2.0 -Notes "Release notes here"

# Create a draft release
npm run release -- -Version 1.2.0 -Draft
```

The script will:
- Build the application using `npm run make`
- Create a GitHub release with the installer
- Upload the `.exe` installer as an asset

**Requirements:**
- GitHub CLI (`gh`) installed and authenticated
- Must be on clean `main` branch
- Administrator privileges for building
- The release script automatically finds `gh.exe` even if not in PATH
