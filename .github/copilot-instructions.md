# Electron LibreMon - Copilot Instructions

## Project Overview

Electron-based desktop hardware monitoring widget for Windows. Displays real-time CPU, GPU, RAM, storage, network stats via a transparent desktop overlay. Uses LibreHardwareMonitor via N-API native addon for direct hardware access.

**Development Requirement**: VS Code must run as Administrator for hardware sensor access.

## Architecture

### Main Components
- **Main Process** (`js/app.js`): Application lifecycle, tray, window management
- **Widget Window** (`html/widget.html`, `js/widget.js`): Transparent frameless overlay with hardware stats
- **Stage Window** (`html/stage.html`, `js/stage.js`): Settings and configuration UI
- **N-API Addon** (`js/libre_hardware_addon/`): Native LibreHardwareMonitor integration
- **NUI Framework** (`html/nui/`): Custom UI component library
- **Helper Library** (`js/electron_helper/helper.js`): Electron utilities

### Key Files
- `config.json`: User configuration (server, poll rate, sensors)
- `forge.config.js`: Electron Forge packaging configuration
- `js/libre_hardware_monitor_native.js`: N-API addon loader
- `js/libre_hardware_monitor_web.js`: Hardware data polling and transformation

### Submodule
- `LibreHardwareMonitor_NativeNodeIntegration/`: N-API addon source with bundled .NET 9.0 runtime

## Coding Style

### Performance-First Philosophy
- **Minimal Dependencies**: Only 2 runtime deps (`electron-squirrel-startup`, `systeminformation`)
- **Custom Frameworks**: NUI framework instead of React/Vue/Angular
- **Direct Implementation**: Manual DOM manipulation, no abstraction layers
- **Bundle Optimization**: Small sizes, efficient resource usage

### Code Patterns
- Object literal organization over classes
- Async/await with functional patterns
- Direct property access over getters/setters
- Use helper library for IPC, not direct calls

### Performance Targets
- CPU: <0.5% typical usage
- Memory: ~200MB ceiling
- Polling: ~400ms via N-API

## AI Guidelines

- **Be Direct**: Blunt, factual feedback without sugar-coating
- **Priority Order**: Fast → Robust → Slim
- **No Unnecessary Dependencies**: Build custom solutions when performant
- **Follow Existing Patterns**: Match the functional, performance-first style

## Release Process

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
