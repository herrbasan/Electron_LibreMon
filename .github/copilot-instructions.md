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

## Native Addon Build Process

When the submodule is updated, rebuild the native addon:

```bash
# Update submodule to latest
git submodule update --remote --merge LibreHardwareMonitor_NativeNodeIntegration

# Build and copy the native addon (single command does both)
node scripts/build-native.js
```

The `build-native.js` script:
1. Runs `npm run rebuild` in `LibreHardwareMonitor_NativeNodeIntegration/NativeLibremon_NAPI`
2. Copies artifacts from `dist/NativeLibremon_NAPI` to `js/libre_hardware_addon`

You can also run via npm: `npm run build-addon`

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
npm run release -- -Notes "Release notes here"

# Or use PowerShell directly
.\scripts\create-release.ps1 -Notes "Release notes here"

# Create a draft release
npm run release -- -Draft
```

The script will:
- Build the application using `npm run make`
- Create a GitHub release with the installer
- Upload the `.exe` installer, nupkg, and RELEASES file as assets
- Sync release tag to local repo

**Requirements:**
- GitHub CLI (`gh`) installed and authenticated
- Must be on clean `main` branch
- Administrator privileges for building
- The release script automatically finds `gh.exe` even if not in PATH

**Options:**
- `-Notes "text"` - Custom release notes
- `-Draft` - Create as draft release
- `-Clean` - Remove old builds before building

## Update System

The application includes a custom update system in `js/electron_helper/update.js` that supports multiple sources:

### HTTP Mode (Default)
```javascript
// Traditional HTTP endpoint
updateHelper.init({
  mode: 'splash',  // or 'widget' or 'silent'
  url: 'https://your-server.com/updates/',
  source: 'http'  // optional, this is default
});
```

### GitHub Mode
```javascript
// Automatic GitHub releases integration
updateHelper.init({
  mode: 'splash',  // or 'widget' or 'silent'  
  url: 'herrbasan/Electron_LibreMon',  // GitHub repo
  source: 'git'
});
```

**GitHub mode automatically:**
- Fetches latest release from GitHub API (with 5s timeout)
- Downloads RELEASES and nupkg files
- Uses existing Squirrel update mechanism
- No manual hosting required

**Update flow:**
- On startup, silently checks for updates via `checkVersion()`
- If update available, shows splash screen for user decision
- User can "Update" (downloads and installs) or "Ignore" (continues to app)
- Network failures or timeouts gracefully fall through to app start
- Prevents app quit when update window is closed before main windows exist

### Squirrel Windows Integration

The app uses Squirrel.Windows for installation and updates. Key learnings:

**Squirrel Events** (`js/squirrel_startup.js`):
- `--squirrel-install`: First installation, creates shortcuts
- `--squirrel-updated`: After update applied, recreates shortcuts
- `--squirrel-uninstall`: Removes shortcuts
- `--squirrel-obsolete`: Old version being replaced (note: no 'd' at end)
- `--squirrel-firstrun`: First run after install

**Critical Implementation Details:**

1. **Window IDs are dynamic** - Never hardcode window IDs. The update splash window gets ID 1 when created first, breaking any `sendToId(1, ...)` calls meant for the widget. Use `broadcast()` instead for IPC.

2. **Skip update check during Squirrel events** - When any `--squirrel-*` argument is present, skip the update check entirely. Squirrel's "update dance" briefly runs old versions which could trigger false update prompts.

3. **Quit handler must be removed before quitAndInstall** - The `preventQuitHandler` (added to keep app running when "Ignore" is clicked) blocks `quitAndInstall()`. Remove it before calling:
   ```javascript
   if (preventQuitHandler) {
       app.off('window-all-closed', preventQuitHandler);
       preventQuitHandler = null;
   }
   autoUpdater.quitAndInstall(true, true);
   ```

4. **Handle both obsolete spellings** - Squirrel sends `--squirrel-obsolete` (without 'd'), but some docs show `--squirrel-obsoleted`. Handle both.

5. **Old version cleanup** - Squirrel automatically removes old app versions during the update dance, but only if the old version properly quits when receiving `--squirrel-obsolete`

## PawnIO Driver

PawnIO is a scriptable kernel driver required by LibreHardwareMonitor for accessing many hardware sensors (CPU temps, voltages, fan speeds, embedded controller data, etc.).

### Why PawnIO is Needed

LibreHardwareMonitor moved from their own kernel driver to PawnIO in recent versions. Without PawnIO:
- Many CPU temperature readings won't work
- Voltage sensors are unavailable
- Fan speed readings may be missing
- Embedded controller access is disabled

### Bundled Installer

The PawnIO installer (`PawnIO_setup.exe`) is bundled in the `bin/` folder and automatically installed during:
- **First installation** (`--squirrel-install`)
- **Updates** (`--squirrel-updated`)

The installer runs silently with the `-install` flag.

### Setup

1. Download PawnIO from https://pawnio.eu/ (Official signed edition)
2. Place `PawnIO_setup.exe` in the `bin/` folder
3. The installer will be packaged with the app and run during installation

### Technical Details

```javascript
// Check PawnIO status programmatically
const pawnio = require('./js/electron_helper/pawnio.js');
const status = pawnio.getStatus();
// Returns: { ok: boolean, installed: boolean, version: string|null, needsUpdate: boolean }

// Manual install (normally done by Squirrel)
const result = await pawnio.install(resourcesPath, logFunction);
// Returns: { success: boolean, message: string }
```

**Registry Locations Checked:**
- `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\PawnIO` (64-bit)
- `HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\PawnIO` (32-bit)

**Service Check:**
- `sc.exe query PawnIO` - Verifies the driver service actually exists

**Minimum Version:** 2.0.0.0

**Download:** https://pawnio.eu/ (Official signed edition recommended)

### Detection Logic (Critical Fix)

The `getStatus()` function checks **both** the registry Uninstall key AND the Windows service existence. This is critical because:

1. **Registry alone is insufficient** - The Uninstall key can exist even when the service is missing ("broken install" state)
2. **Broken installs cause silent failures** - Sensors requiring PawnIO simply return no data
3. **Installer refuses to reinstall** - PawnIO's own installer shows "previous installation found" error

**Solution implemented in `pawnio.js`:**
```javascript
// getStatus() now returns:
{
  ok: boolean,           // true only if BOTH registry AND service are good
  installed: boolean,    // false if service missing (even if registry exists)
  version: string|null,
  needsUpdate: boolean,
  serviceExists: boolean,
  serviceRunning: boolean,
  registryOnly: boolean  // true = broken state (registry exists, service doesn't)
}
```

**When `registryOnly: true`:**
1. Run uninstaller first (`-uninstall`) to clean stale registry
2. Brief pause for cleanup
3. Then run installer (`-install`) fresh

This prevents the "previous installation found" dialog and ensures clean installs.
