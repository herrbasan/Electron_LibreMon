# Electron LibreMon - Copilot Instructions

## Project Overview
Electron LibreMon is an Electron-based desktop application that serves two primary purposes:

1. **Local System Monitoring**: Provides a customizable desktop widget and settings interface for displaying real-time hardware statistics (CPU, GPU, RAM, etc.) locally on the user's machine. The widget is a transparent, frameless overlay showing hardware metrics with live graphs for CPU, GPU, memory, and network stats. The settings window displays detailed sensor information organized by hardware type (motherboard voltages/temperatures, individual sensor readings).

2. **Centralized Data Reporting**: Collects and reports hardware sensor data to a backend server, enabling centralized monitoring and display of all machines running this application. The developer maintains a Node.js server that aggregates data from multiple machines and displays them in a unified dashboard view, showing all systems side-by-side with their respective hardware metrics.

The application integrates LibreHardwareMonitor to collect hardware data, allows users to configure which sensors to monitor, and handles both local display and remote data transmission.

## Architecture

### Main Components
- **Electron Main Process** (`js/app.js`): Manages application lifecycle, spawns LibreHardwareMonitor.exe, creates tray icon and windows
- **Widget Window** (`html/widget.html`, `js/widget.js`): Transparent, frameless desktop widget displaying hardware stats
- **Stage Window** (`html/stage.html`, `js/stage.js`): Settings/configuration window with detailed hardware information
- **LibreHardwareMonitor Integration** (`js/libre_hardware_monitor_web.js`): Polls data from LibreHardwareMonitor's web server
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
  - Launches LibreHardwareMonitor.exe if not running
  - Creates system tray with menu (Show Settings, Show Widget, Exit)
  - Manages widget and stage windows with enhanced restart logic
  - Handles IPC communication for sensor group updates
  - Restarts stage window every 10 minutes (only when hidden, prevents user interruption)
  - Terminates LibreHardwareMonitor on app quit via `proc.kill()`
  - Supports dynamic sensor group reconfiguration with LHM restart

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
- `js/libre_hardware_monitor_web.js`: Interfaces with LibreHardwareMonitor
  - Polls `http://localhost:8085/data.json` for hardware data
  - Parses and structures data by hardware type (cpu, gpu, memory, etc.)
  - Handles different sensor types and groupings

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
- `bin/LibreHardwareMonitor/`: LibreHardwareMonitor executable and dependencies
- `bin/libre_defaults.xml`: Default configuration for LibreHardwareMonitor

#### Helper Utilities
- `js/electron_helper/helper.js`: Extensive Electron helper library
  - Window creation and management
  - IPC handling
  - File system operations
  - Global state management
  - Dialogs, screens, shell operations

## Backend Integration
- **Ingest Server**: Configurable HTTP endpoint for centralized data collection
- **Data Transmission**: JSON-formatted sensor data sent via POST requests
- **Polling Control**: Configurable poll rates (default 1000ms) for data transmission frequency
- **Sensor Selection**: Users can choose which sensors to include in backend reports
- **Sensor Groups**: Users can enable/disable entire hardware categories (CPU, GPU, Memory, Motherboard, Storage, Network, PSU, Battery, Fan Controller)
  - Changes trigger LibreHardwareMonitor restart with updated XML configuration
  - Widget and stage UI automatically refresh after sensor group changes
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
- Includes bin/ directory as extra resource
- Generates Windows installer with Squirrel

## Key Concepts for AI Assistance
- **IPC Communication**: Main process ↔ renderer processes for data and events
- **Window Management**: Custom window behaviors (frameless, transparent, always-on-top)
- **Hardware Polling**: Real-time data fetching from external monitoring tool
- **UI Components**: NUI framework for consistent, themeable interface
- **Configuration**: JSON-based config with user preferences
- **Lifecycle Management**: Proper startup/shutdown of external processes
- **Sensor Group Management**: Dynamic reconfiguration of LibreHardwareMonitor via XML template modification
- **Widget Reset Pattern**: `window.resetWidget()` exposed from ES module for complete DOM reinitialization

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
- **Memory Usage**: Stable ceiling around 210MB for the main process
- **Polling Efficiency**: Incremental DOM updates outperform native N-API addon approaches
- **No External Framework Overhead**: Custom NUI framework eliminates React/Vue/Angular bundle costs
- **Stage Window Restart**: 10-minute restart cycle mitigates potential Electron renderer memory leaks (only when hidden)

The application achieves excellent performance through direct DOM manipulation, efficient data structure operations, and minimal abstraction layers. Performance-first design decisions consistently prioritize speed and resource efficiency over developer convenience.

### Response Guidelines for AI Assistance
- **Be Truthful and Direct**: Avoid politeness or sugar-coating. Provide blunt, factual feedback without softening criticism.
- **Prioritize User's Hierarchy**: Focus on **Fast, Robust, Slim** in that order. Ignore maintainability concerns as they often introduce performance costs without real readability benefits.
- **Align with Goals**: Support creation of sleek, highly optimized, robust code. Critique suggestions that compromise speed, reliability, or minimalism.

When contributing to this codebase, prioritize **performance and efficiency** over developer convenience. Build custom solutions rather than adding dependencies, and follow the established functional programming patterns.
