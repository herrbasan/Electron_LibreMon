# Electron LibreMon

Desktop hardware monitoring widget and settings interface using LibreHardwareMonitor for real-time system statistics.

## Features

- **Real-time Hardware Monitoring**: CPU, GPU, RAM, storage, network, motherboard sensors
- **Customizable Widget**: Transparent, frameless desktop overlay with live hardware stats
- **Sensor Group Configuration**: Enable/disable entire hardware categories (CPU, GPU, Memory, Motherboard, Storage, Network, PSU, Battery, Fan Controller)
- **Individual Sensor Selection**: Choose specific sensors to display and report
- **System Tray Integration**: Quick access to widget and settings
- **Auto-start Support**: Launch at Windows login

## Architecture

- **Performance-First**: Minimal dependencies, custom UI framework, direct native hardware access
- **Electron-based**: Native Windows desktop application
- **N-API Native Integration**: Direct LibreHardwareMonitor access via native addon (no external processes)
- **Custom NUI Framework**: Lightweight UI components without React/Vue/Angular overhead
- **Low-Footprint**: <200MB total memory, ~400ms poll time, efficient data processing

## Requirements

- Windows 10/11 (admin privileges required for hardware sensor access)
- No external dependencies - .NET 9.0 runtime fully bundled with N-API addon (self-contained deployment)

## Installation

```bash
# Clone repository with submodules
git clone --recurse-submodules https://github.com/herrbasan/Electron_LibreMon.git

# Or if already cloned, initialize submodules
git submodule update --init --recursive

# Install dependencies (automatically initializes submodules via postinstall script)
npm install

# Run in development mode
npm start

# Package for production
npm run package
```

## Configuration

Configuration is stored in `config.json`:

- `ingest_server`: Backend endpoint for centralized data collection (editable in settings UI)
- `enable_ingest`: Enable/disable sending data to ingest server (default: false, editable in settings UI)
- `poll_rate`: Data polling interval in milliseconds (default: 1000)
- `sensor_selection`: Array of selected sensor IDs
- `sensor_groups`: Hardware categories to monitor (CPU, GPU, Memory, etc.)
- `start_at_login`: Launch application at Windows startup
- `widget_bounds`: Widget window position and size

## Data Reporting

The application can send hardware statistics to a centralized server for multi-machine monitoring. Configure in the settings window:

1. **Enable Data Reporting**: Toggle checkbox to enable/disable reporting
2. **Server URL**: Enter your backend endpoint URL (e.g., `http://192.168.1.100:4440/computer_stats`)
3. **Validation**: URL is validated - invalid or empty URLs prevent data transmission
4. **Fire-and-Forget**: Data transmission is non-blocking and fails silently if server is unreachable

Data is sent as JSON POST requests with system information and sensor readings.

## Sensor Groups

Toggle entire hardware categories in the settings window:
- **CPU** - Processor temperature, load, frequency, power
- **GPU** - Graphics card temperature, load, memory, fan speed
- **Memory** - RAM usage and timings
- **Motherboard** - Voltages, temperatures, fan speeds
- **Storage** - Drive temperature, read/write speeds, usage
- **Network** - Upload/download speeds, data transferred
- **PSU** - Power supply voltages and currents
- **Battery** - Laptop battery level and charge rate
- **Fan Controller** - Custom fan controller sensors

Changes trigger automatic stage window restart to reinitialize the N-API addon with updated configuration.

## Development

Built with:
- **Electron** - Desktop application framework
- **N-API Native Addon** - Direct LibreHardwareMonitor integration via native module
- **LibreHardwareMonitorLib.dll** - Hardware sensor data collection library
- **systeminformation** - System info (OS, hardware details)
- **Custom NUI Framework** - Lightweight UI components

Project follows **Fast, Robust, Slim** philosophy with minimal dependencies and optimized performance.

### Development Notes

- **Administrator Privileges Required**: VS Code must run as Administrator for hardware sensor access
- **N-API Addon**: Pre-built native module in `js/libre_hardware_addon/` with bundled .NET 9.0 runtime
- **Path Detection**: Uses `__dirname.includes('.asar')` to differentiate dev vs packaged modes
- **Memory Management**: 10-minute stage window restart cycle (only when hidden) for memory stability
- **System Info Caching**: Main process caches systeminformation data to avoid re-polling on restarts

## License

See LICENSE file for details.
