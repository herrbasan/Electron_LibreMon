# Electron LibreMon - Copilot Instructions

## Project Overview
Electron LibreMon is an Electron-based desktop application that serves two primary purposes:

1. **Local System Monitoring**: Provides a customizable desktop widget and settings interface for displaying real-time hardware statistics (CPU, GPU, RAM, etc.) locally on the user's machine. The widget is a transparent, frameless overlay showing hardware metrics with live graphs for CPU, GPU, memory, and network stats. The settings window displays detailed sensor information organized by hardware type (motherboard voltages/temperatures, individual sensor readings).

2. **Centralized Data Reporting**: Collects and reports hardware sensor data to a backend server, enabling centralized monitoring and display of all machines running this application. The developer maintains a Node.js server that aggregates data from multiple machines and displays them in a unified dashboard view, showing all systems side-by-side with their respective hardware metrics.

The application integrates LibreHardwareMonitor via a **native N-API addon**, allowing direct hardware access without spawning external processes. Users can configure which sensors to monitor, and the application handles both local display and remote data transmission.

**Development Requirement**: VS Code must be run as Administrator. LibreHardwareMonitor requires elevated privileges to access hardware sensors. If encountering access errors, remind the user to restart VS Code as Administrator.

## Architecture

### Main Components
- **Electron Main Process** (`js/app.js`): Manages application lifecycle, creates tray icon and windows, caches system information
- **Widget Window** (`html/widget.html`, `js/widget.js`): Transparent, frameless desktop widget displaying hardware stats
- **Stage Window** (`html/stage.html`, `js/stage.js`): Settings/configuration window with detailed hardware information
- **N-API Native Addon** (`js/libre_hardware_addon/`): Pre-built native module for direct LibreHardwareMonitor access
- **Native Monitor Wrapper** (`js/libre_hardware_monitor_native.js`): Loads and manages N-API addon lifecycle
- **Hardware Monitor Interface** (`js/libre_hardware_monitor_web.js`): Polls data from N-API addon and transforms to application format
- **NUI Framework** (`html/nui/`): Custom UI component library for consistent styling and interactions
- **Helper Library** (`js/electron_helper/helper.js`): Comprehensive Electron utilities for window management, IPC, etc.

### Key Files and Directories

#### Configuration
- `package.json`: Electron app metadata, dependencies (electron, systeminformation), build scripts
- `forge.config.js`: Electron Forge configuration for packaging and distribution
- `config.json`: User configuration (ingest server, poll rate, sensor selection)
- `env.json`: Environment settings (logging flag)

#### Main Application
- `js/app.js`: Main Electron process
  - Creates system tray with menu (Show Settings, Show Widget, Exit)
  - Manages widget and stage windows with enhanced restart logic
  - Handles IPC communication for sensor group updates and system info caching
  - Restarts stage window every 10 minutes (only when hidden, prevents user interruption)
  - Caches system information on first request to avoid re-polling on stage restarts
  - Supports dynamic sensor group reconfiguration with stage window restart

#### Windows
- **Widget Window**:
  - `html/widget.html`: Minimal HTML with `.hm_widget` container
  - `js/widget.js`: Preload script handling IPC for stats and window events
  - `html/js/widget.js`: ES module providing render and reset functions
  - Exposes `window.resetWidget()` for complete DOM reinitialization on sensor group changes
- **Stage Window**:
  - `html/stage.html`: Full NUI app layout with title bar, content, sidebar
  - `js/stage.js`: Preload script for settings, system info collection, configuration
  - Includes sensor group configuration UI with live restart capability
  - Updates widget via IPC when sensor groups change

#### Hardware Monitoring
- `js/libre_hardware_monitor_native.js`: N-API addon loader
  - Loads pre-built librehardwaremonitor_native.node from libre_hardware_addon/
  - Detects dev vs packaged mode using __dirname.includes('.asar')
  - Provides init(config), poll(options), and shutdown() methods
  - Handles .NET 9.0 runtime initialization (one-time per process)
- `js/libre_hardware_monitor_web.js`: Hardware data interface
  - Initializes N-API addon with sensor group configuration from config
  - Polls hardware data via nativeMonitor.poll() (~400ms)
  - Parses and structures data by hardware type (cpu, gpu, memory, etc.)
  - Handles different sensor types and groupings
  - Note: Cannot reinit addon in same process due to .NET CLR limitation

#### UI Framework
- `html/nui/nui.js`: Core NUI framework for window management, sidebars, CSS variables
- `html/nui/nui_ut.js`: Utility functions for DOM manipulation, environment detection
- `html/nui/nui_sysmon_poll.js`: Hardware monitoring widget renderer with incremental DOM updates
  - Maintains internal state for efficient re-rendering
  - Clears state on re-initialization for sensor group changes
- Various NUI components: graphs, lists, selects, etc. for building the interface

#### Styling
- `html/css/main.css`: Base styles
- `html/css/sysmon.css`: System monitor specific styles
- `html/css/widget.css`: Widget-specific styles
- `html/nui/css/`: NUI framework stylesheets

#### Binaries
- `js/libre_hardware_addon/`: N-API native addon and dependencies
  - `librehardwaremonitor_native.node`: Pre-built N-API addon
  - `.NET 9.0 runtime DLLs`: coreclr.dll, hostfxr.dll, nethost.dll, etc. (self-contained deployment)
  - `LibreHardwareMonitorLib.dll`: Hardware monitoring library (custom fork with Intel GPU VRAM support)
  - `200+ System.*.dll files`: .NET Base Class Library
  - `LibreHardwareMonitorBridge.runtimeconfig.json`: Runtime config with empty `includedFrameworks` array to force bundled runtime usage
  - **Source**: Built from `LibreHardwareMonitor_NativeNodeIntegration` submodule
- `bin/libre_defaults.xml`: XML template for LibreHardwareMonitor configuration (legacy, not used with N-API)

#### Build System (N-API Addon)
The N-API addon is built from the `LibreHardwareMonitor_NativeNodeIntegration` submodule with special handling for Node.js 24.9.0 toolset incompatibility:

**Problem**: Node.js 24.9.0 generates Visual Studio project files requesting ClangCL compiler, but VS2019 Build Tools only includes MSVC v142.

**Solution**: Automatic project file patching during build:
1. `NativeLibremon_NAPI/package.json` install script runs: `node-gyp configure` → `node patch-vcxproj.js` → `node-gyp build`
2. `patch-vcxproj.js` walks build directory and replaces `<PlatformToolset>ClangCL</PlatformToolset>` with `<PlatformToolset>v142</PlatformToolset>`
3. `NativeLibremon_NAPI/.npmrc` sets `msvs_version=2019` and `msbuild_toolset=v142` to inform node-gyp
4. `binding.gyp` includes `"msvs_toolset": "v142"` for main project (dependencies still need patching)

**Files**:
- `LibreHardwareMonitor_NativeNodeIntegration/NativeLibremon_NAPI/patch-vcxproj.js`: Toolset patcher script
- `LibreHardwareMonitor_NativeNodeIntegration/NativeLibremon_NAPI/.npmrc`: npm config forcing MSVC
- `LibreHardwareMonitor_NativeNodeIntegration/NativeLibremon_NAPI/binding.gyp`: Build config with v142 toolset
- `LibreHardwareMonitor_NativeNodeIntegration/scripts/build-napi.ps1`: Build orchestration script

**Recent Updates (Nov 21, 2025)**:
- Updated LibreHardwareMonitor submodule to commit `5b2645bcbbe10373ec21afc3e95cda3a0a93c97e`
- Removed obsolete `IsDimmDetectionEnabled` property from `HardwareMonitorBridge.cs` (API removed in newer LHM versions)
- Changed managed bridge to use ProjectReference instead of pre-built DLL reference
  - Old: Referenced `deps/LibreHardwareMonitor/LibreHardwareMonitorLib.dll` (stale)
  - New: References `deps/LibreHardwareMonitor-src/LibreHardwareMonitorLib/LibreHardwareMonitorLib.csproj` (always current)
  - Ensures bridge compiles against current source instead of cached build

#### Helper Utilities
- `js/electron_helper/helper.js`: Extensive Electron helper library
  - Window creation and management
  - IPC handling
  - File system operations
  - Global state management
  - Dialogs, screens, shell operations

## Backend Integration
- **Ingest Server**: Configurable HTTP endpoint for centralized data collection
- **Data Transmission**: JSON-formatted sensor data sent via POST requests (fire-and-forget, non-blocking)
- **Polling Control**: Configurable poll rates (default 1000ms) for data transmission frequency
- **Sensor Selection**: Users can choose which sensors to include in backend reports
- **Sensor Groups**: Users can enable/disable entire hardware categories (CPU, GPU, Memory, Motherboard, Storage, Network, PSU, Battery, Fan Controller)
  - Changes trigger stage window restart to reinitialize N-API addon with updated configuration
  - Widget UI automatically refreshes after sensor group changes
- **Multi-Machine Monitoring**: Enables dashboard views of hardware stats across multiple computers
- Requires administrator privileges (configured in forge.config.js)
- Uses custom `raum://` protocol for file serving
- Implements custom window management with frameless, transparent windows
- Includes comprehensive logging and debugging features
- Supports dark/light theme switching
- Widget can be toggled via tray or hotkeys

## Build and Packaging
- Uses Electron Forge for building
- Packages with ASAR
- N-API addon directory excluded from ASAR and placed in extraResource
- Generates Windows installer with Squirrel
- Requires administrator privileges (configured in forge.config.js)
- **Self-Contained .NET Deployment**: Build process includes fix-runtimeconfig.js script that strips framework dependency from runtimeconfig.json, ensuring app uses bundled .NET runtime instead of system installation

## Key Concepts for AI Assistance
- **IPC Communication**: Main process ↔ renderer processes for data and events
- **Window Management**: Custom window behaviors (frameless, transparent, always-on-top)
- **Hardware Polling**: Real-time data fetching via N-API native addon
- **UI Components**: NUI framework for consistent, themeable interface
- **Configuration**: JSON-based config with user preferences
- **Lifecycle Management**: Proper startup/shutdown of N-API addon
- **Sensor Group Management**: Dynamic reconfiguration via stage window restart
- **Widget Reset Pattern**: `window.resetWidget()` exposed from ES module for complete DOM reinitialization
- **System Info Caching**: Main process caches systeminformation data to avoid re-polling on stage restarts

## Coding Style & Development Approach

### Performance-First Philosophy
This codebase follows a **performance-first** development approach with minimal dependencies and custom implementations:

- **Minimal Dependencies**: Only 2 runtime dependencies (`electron-squirrel-startup`, `systeminformation`)
- **Custom Frameworks**: Built custom NUI UI framework instead of using React/Vue/Angular
- **Direct Implementation**: Manual DOM manipulation, custom protocol handling (`raum://`), and direct data structure operations
- **Bundle Optimization**: Focus on small bundle sizes and efficient resource usage

### Functional Programming Style
- **Object Literal Organization**: Functions organized in object literals rather than classes
- **Async/Await Patterns**: Modern JavaScript with promises and async functions throughout
- **Functional Patterns**: Heavy use of pure functions, data transformation pipelines, and functional array methods
- **Concise Code**: Brief, focused functions that avoid verbosity

### Code Patterns to Follow
- **Direct Property Manipulation**: Instead of complex getters/setters, use direct object property access
- **Functional Data Processing**: Transform data through chains of pure functions
- **IPC Abstraction**: Use the helper library for Electron IPC instead of direct calls
- **Custom Utilities**: Leverage the extensive helper functions rather than adding new dependencies
- **Performance Optimization**: Prefer direct implementations over abstraction layers when performance is critical

### Development Trade-offs
- **Pros**: Excellent runtime performance, small bundle sizes, full control over implementation
- **Cons**: Higher development complexity, more manual implementation required
- **Best For**: System-level applications where performance and resource usage are critical

### Performance Characteristics
- **CPU Usage**: Typically stays below 0.5% with peaks occurring less than once per minute
- **Memory Usage**: Stable ceiling around 200MB total (main + renderers)
- **Polling Efficiency**: N-API direct calls (~400ms) outperform web server polling (500ms+)
- **No External Framework Overhead**: Custom NUI framework eliminates React/Vue/Angular bundle costs
- **Stage Window Restart**: 10-minute restart cycle mitigates potential Electron renderer memory leaks (only when hidden)
- **System Info Caching**: Avoids expensive systeminformation re-polling on stage restarts

The application achieves excellent performance through direct DOM manipulation, efficient data structure operations, and minimal abstraction layers. Performance-first design decisions consistently prioritize speed and resource efficiency over developer convenience.

### Response Guidelines for AI Assistance
- **Be Truthful and Direct**: Avoid politeness or sugar-coating. Provide blunt, factual feedback without softening criticism.
- **Prioritize User's Hierarchy**: Focus on **Fast, Robust, Slim** in that order. Ignore maintainability concerns as they often introduce performance costs without real readability benefits.
- **Align with Goals**: Support creation of sleek, highly optimized, robust code. Critique suggestions that compromise speed, reliability, or minimalism.

When contributing to this codebase, prioritize **performance and efficiency** over developer convenience. Build custom solutions rather than adding dependencies, and follow the established functional programming patterns.
